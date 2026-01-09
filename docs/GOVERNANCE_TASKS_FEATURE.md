# Governance To-Do / Tasks Feature

## Overview

The Governance To-Do feature provides automated task management for AI systems, ensuring compliance with EU AI Act, UK AI Act, and MAS regulations. Tasks are automatically generated based on system state and lifecycle stage, helping teams track and complete governance requirements.

## Key Features

- **Auto-Generated Tasks**: Tasks are automatically created based on system state (risk assessments, documentation, lifecycle stage, compliance checklists)
- **Regulation-Specific**: Tasks are scoped to EU, UK, or MAS regulations
- **Blocking Tasks**: EU lifecycle transitions are blocked by incomplete blocking tasks
- **Audit Trail**: Completed tasks are immutable (except evidence links) to preserve history
- **Evidence Links**: Optional evidence can be attached when marking tasks as completed
- **Auto-Completion**: Tasks automatically complete when related actions are taken (e.g., risk assessment approval)

## Database Schema

### Table: `governance_tasks`

```sql
CREATE TABLE governance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  regulation TEXT NOT NULL CHECK (regulation IN ('EU', 'UK', 'MAS')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Blocked')),
  blocking BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_link TEXT,
  related_entity_id UUID,
  related_entity_type TEXT CHECK (related_entity_type IN ('risk_assessment', 'documentation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Key Constraints

- **Unique Rule**: One task per `(ai_system_id, regulation, title)` combination
- **Immutable Completed Tasks**: Once completed, tasks cannot be modified except for `evidence_link`
- **Auto Timestamp**: `completed_at` is automatically set when status changes to "Completed"
- **No Deletes**: Tasks cannot be deleted to preserve auditability

## Auto-Generation Rules

### Universal Rules (All Regulations)

#### 1. Approved Risk Assessment Required
- **Condition**: No approved risk assessments exist
- **Task**: "Obtain an approved risk assessment"
- **Blocking**: `true` for EU, `false` for UK/MAS
- **Auto-Complete**: When a risk assessment is approved

#### 2. Documentation Generation
- **Condition**: No current compliance documentation exists
- **Task**: "Generate compliance documentation"
- **Blocking**: `false` (informational)
- **Auto-Complete**: When documentation is generated

### EU AI Act Specific Rules

#### 3. Testing Stage Requirement
- **Condition**: Lifecycle stage is "Testing" AND no submitted/approved assessments exist
- **Task**: "Provide a completed assessment for Testing"
- **Blocking**: `true`
- **Auto-Complete**: When at least one submitted/approved assessment exists

#### 4. Deployed/Monitoring Stage Requirement
- **Condition**: Lifecycle stage is "Deployed" or "Monitoring" AND no approved assessments exist
- **Task**: "Approved assessment required for Deployed/Monitoring"
- **Blocking**: `true`
- **Auto-Complete**: When at least one approved assessment exists

#### 5. Accountable Person Assignment
- **Condition**: Lifecycle stage is "Deployed" or "Monitoring" AND accountable person is missing/not specified
- **Task**: "Assign accountable person"
- **Blocking**: `true`
- **Auto-Complete**: When accountable person is assigned

### UK AI Act Specific Rules

#### 6. UK Compliance Checklist
- **Condition**: UK AI principles have gaps OR overall assessment is not "Compliant"
- **Task**: "Complete UK compliance checklist"
- **Blocking**: `false` (informational)
- **Auto-Complete**: When all principles are met and overall assessment is "Compliant"

### MAS Specific Rules

#### 7. MAS Compliance Checklist
- **Condition**: Any MAS pillar is not "Compliant" OR overall compliance status is not "Compliant"
- **Task**: "Complete MAS compliance checklist"
- **Blocking**: `false` (informational)
- **Auto-Complete**: When all pillars are "Compliant" and overall status is "Compliant"

## API Endpoints

### GET `/api/ai-systems/[id]/tasks`
Retrieves all governance tasks for a system, automatically evaluating and creating/updating tasks.

**Response:**
```json
[
  {
    "id": "uuid",
    "ai_system_id": "uuid",
    "title": "Obtain an approved risk assessment",
    "description": "Approve at least one risk assessment...",
    "regulation": "EU",
    "status": "Pending",
    "blocking": true,
    "evidence_link": null,
    "related_entity_id": null,
    "related_entity_type": "risk_assessment",
    "created_at": "2024-01-01T00:00:00Z",
    "completed_at": null
  }
]
```

### PATCH `/api/governance-tasks/[taskId]`
Updates a task (typically to mark as completed).

**Request Body:**
```json
{
  "status": "Completed",
  "evidence_link": "https://example.com/evidence.pdf"
}
```

**Constraints:**
- Only `status` and `evidence_link` can be updated
- Completed tasks are immutable (except evidence_link)
- Cannot change status from "Completed" to another status

## UI Components

### TasksTab Component
Located at `app/ai-systems/[id]/components/Tasks/TasksTab.tsx`

**Features:**
- Groups tasks by regulation (EU, UK, MAS)
- Displays status badges (Pending, Blocked, Completed)
- Shows blocking indicator for EU tasks
- Allows marking tasks as completed with optional evidence link
- Displays related entity badges (Risk Assessment, Documentation)

**Visual Indicators:**
- 🔴 **Blocked**: Red badge with "Blocking (EU)" label
- 🟡 **Pending**: Amber badge
- 🟢 **Completed**: Green badge with checkmark
- 🛡️ **Blocking Icon**: ShieldAlert icon for blocking tasks

## Integration Points

### 1. Lifecycle Transitions
**File**: `app/api/ai-systems/[id]/lifecycle/route.ts`

When a lifecycle stage is updated:
1. Checks for blocking tasks before allowing transition
2. Re-evaluates governance tasks after successful transition
3. Returns error if blocking tasks exist

```typescript
// Check blocking tasks before transition
const blockingTasks = await getBlockingTasks(systemId);
if (blockingTasks.length > 0) {
  return NextResponse.json({
    error: "Lifecycle transition blocked by open governance tasks",
    blocking_tasks: blockingTasks,
  }, { status: 400 });
}

// Re-evaluate after transition
await evaluateGovernanceTasks(systemId);
```

### 2. Risk Assessment Approval
**File**: `app/api/risk-assessments/[id]/approve/route.ts`

When a risk assessment is approved:
1. Automatically completes related "Obtain an approved risk assessment" task
2. Triggers documentation regeneration (existing behavior)

```typescript
// Auto-complete task after approval
const { evaluateGovernanceTasks } = await import("@/lib/governance-tasks");
await evaluateGovernanceTasks(assessment.ai_system_id);
```

### 3. Documentation Generation
**File**: `lib/documentation-auto-generate.ts`

When documentation is generated:
1. Automatically completes related "Generate compliance documentation" task

```typescript
// Auto-complete task after documentation generation
const { evaluateGovernanceTasks } = await import("@/lib/governance-tasks");
await evaluateGovernanceTasks(systemId);
```

## Core Logic

### Task Evaluation Engine
**File**: `lib/governance-tasks.ts`

The `evaluateGovernanceTasks()` function:
1. Fetches system context (EU/UK/MAS)
2. Retrieves existing tasks
3. Checks system state (risk assessments, documentation, lifecycle, compliance)
4. Creates or updates tasks based on rules
5. Auto-completes tasks when conditions are met
6. Returns updated task list

**Key Functions:**
- `evaluateGovernanceTasks(systemId)`: Main evaluation function
- `getBlockingTasks(systemId)`: Returns only blocking, incomplete tasks
- `ensureTask()`: Creates or updates a task (idempotent)
- `completeTask()`: Marks a task as completed

## Governance Rules Summary

| Regulation | Task | Blocking | Auto-Complete Trigger |
|------------|------|----------|----------------------|
| All | Approved risk assessment | EU: Yes, UK/MAS: No | Risk assessment approved |
| All | Generate documentation | No | Documentation generated |
| EU | Testing stage assessment | Yes | Submitted/approved assessment exists |
| EU | Deployed/Monitoring assessment | Yes | Approved assessment exists |
| EU | Assign accountable person | Yes | Accountable person assigned |
| UK | Complete compliance checklist | No | All principles met, status "Compliant" |
| MAS | Complete compliance checklist | No | All pillars "Compliant", status "Compliant" |

## Usage Examples

### Viewing Tasks
Navigate to an AI System detail page and click the "To-Do" tab. Tasks are automatically evaluated and displayed.

### Completing a Task
1. Optionally enter an evidence link
2. Click "Mark Completed"
3. Task status updates to "Completed" and becomes immutable

### Blocking Lifecycle Transition
If blocking tasks exist, lifecycle transitions will fail with:
```json
{
  "error": "Lifecycle transition blocked by open governance tasks",
  "blocking_tasks": [...]
}
```

## Permissions

Currently, any authenticated user can:
- View all governance tasks
- Create tasks (via auto-generation)
- Update task status and evidence links
- **Cannot** delete tasks (preserves auditability)

Future enhancements can add role-based access control.

## Auditability

- **No Deletes**: Tasks cannot be deleted
- **Immutable Completed**: Completed tasks cannot be modified (except evidence_link)
- **Timestamps**: `created_at` and `completed_at` preserve history
- **Evidence Links**: Optional evidence can be attached to completed tasks

## Migration

Run the migration to create the `governance_tasks` table:

```bash
# In Supabase SQL Editor or CLI
psql -f supabase/migrations/add_governance_tasks.sql
```

Or apply via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/add_governance_tasks.sql`
3. Execute

## Type Definitions

**File**: `types/governance-task.ts`

```typescript
export type GovernanceRegulation = 'EU' | 'UK' | 'MAS';
export type GovernanceTaskStatus = 'Pending' | 'Completed' | 'Blocked';

export interface GovernanceTask {
  id: string;
  ai_system_id: string;
  title: string;
  description: string | null;
  regulation: GovernanceRegulation;
  status: GovernanceTaskStatus;
  blocking: boolean;
  evidence_link: string | null;
  related_entity_id: string | null;
  related_entity_type: 'risk_assessment' | 'documentation' | null;
  created_at: string;
  completed_at: string | null;
}
```

## Troubleshooting

### Tasks Not Appearing
- Ensure the migration has been run
- Check that the system exists in one of the compliance tables (EU/UK/MAS)
- Verify user is authenticated

### Tasks Not Auto-Completing
- Check that related actions (approval, documentation generation) completed successfully
- Verify task evaluation is called after related actions
- Check console logs for errors in `evaluateGovernanceTasks()`

### Lifecycle Transition Blocked
- Review blocking tasks in the To-Do tab
- Complete or resolve blocking tasks before attempting transition
- Note: Only EU systems have blocking task enforcement

## Future Enhancements

- Role-based access control for task management
- Task templates for custom governance requirements
- Task dependencies and workflows
- Email notifications for blocking tasks
- Task analytics and reporting
- Integration with external task management systems

