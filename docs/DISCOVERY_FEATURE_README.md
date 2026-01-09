# AI Asset Discovery & Shadow AI Detection Feature

## Table of Contents
1. [Why This Feature is Important](#why-this-feature-is-important)
2. [What This Feature Does](#what-this-feature-does)
3. [Core Concepts](#core-concepts)
4. [Complete Feature Flow](#complete-feature-flow)
5. [Step-by-Step User Guide](#step-by-step-user-guide)
6. [Governance & Compliance Impact](#governance--compliance-impact)
7. [Technical Architecture](#technical-architecture)

---

## Why This Feature is Important

### The Shadow AI Problem

**Shadow AI** refers to AI systems and tools that are being used within an organization but are **not formally registered, approved, or governed** by the compliance and IT teams. This creates significant risks:

1. **Compliance Violations**
   - Unregistered AI systems may violate regulatory requirements (EU AI Act, UK AI Act, MAS guidelines)
   - Organizations cannot demonstrate compliance if they don't know what AI systems are in use
   - Risk of fines, legal penalties, and reputational damage

2. **Security Risks**
   - Unmonitored AI systems may process sensitive data without proper safeguards
   - No visibility into data flows, access controls, or security measures
   - Potential data breaches or privacy violations

3. **Operational Risks**
   - Shadow AI systems may not follow organizational policies
   - No documentation, risk assessments, or governance oversight
   - Difficult to audit or maintain

4. **Business Impact**
   - Inability to track AI usage across the organization
   - Duplicate systems and wasted resources
   - Lack of centralized governance and control

### How This Feature Solves the Problem

The **AI Asset Discovery & Shadow AI Detection** feature helps organizations:

- **Discover** AI systems that are in use but not registered
- **Track** potential Shadow AI through a centralized dashboard
- **Link** discovered assets to existing registered systems
- **Register** new systems that were previously unknown
- **Flag** confirmed Shadow AI to block compliance approvals
- **Maintain** a complete audit trail of all discovery actions

This ensures organizations have **full visibility** into their AI landscape and can maintain **regulatory compliance**.

---

## What This Feature Does

### Primary Functions

1. **Manual Discovery Input**
   - Allows users to manually input discovered AI assets
   - Supports multiple discovery sources: API endpoints, repository URLs, vendor declarations, manual hints
   - Captures metadata: vendor, confidence level, environment, description

2. **Discovery Dashboard**
   - Centralized view of all discovered AI assets
   - Real-time statistics: total discovered, potential shadow AI, confirmed shadow AI, linked assets
   - Filterable table with detailed asset information

3. **Asset Review & Management**
   - Link discovered assets to existing registered systems
   - Create new AI system registrations from discovered assets
   - Mark assets as confirmed Shadow AI
   - Resolve false positives or non-relevant discoveries

4. **Shadow AI Governance**
   - Automatic blocking of compliance approvals when Shadow AI is detected
   - Warning banners on dashboards
   - Audit trail of all governance actions

5. **Audit Trail**
   - Complete history of all discovery events
   - Tracks who performed what action and when
   - Supports compliance audits and reporting

---

## Core Concepts

### 1. Discovered AI Asset

A **Discovered Asset** is a potential AI system that has been detected through various signals but is **not yet confirmed** or linked to a registered system.

**Characteristics:**
- Has a `source_type` (how it was discovered)
- Has detected information (name, vendor, endpoint/repo)
- Has a `shadow_status` (potential, confirmed, or resolved)
- May or may not be linked to a registered system

### 2. Shadow AI

A discovered asset becomes **Shadow AI** when:

- It is **not linked** to any registered AI system (`linked_system_id` is null)
- **AND** it is marked as `shadow_status: 'confirmed'`
- **OR** it is used in production but not declared/registered

**Impact:**
- Blocks compliance approvals for related systems
- Triggers governance warnings
- Requires resolution before compliance can proceed

### 3. Discovery Sources

The feature supports four types of discovery inputs:

1. **`repo_scan`** - Repository Signal Detection
   - User pastes GitHub/GitLab repo URL
   - User manually selects detected AI libraries (OpenAI SDK, LangChain, etc.)

2. **`api_scan`** - API Endpoint Detection
   - User pastes API endpoints
   - System detects known AI vendors (OpenAI, Anthropic, Gemini, Azure OpenAI)

3. **`vendor_detection`** - Vendor Usage Declaration
   - User declares external AI vendors used by teams
   - Creates discovered asset entries for tracking

4. **`manual_hint`** - Manual Hint
   - User manually enters any discovered AI asset
   - Flexible input for any discovery method

---

## Complete Feature Flow

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCOVERY INPUT                           │
│  User manually inputs discovered asset (API/Repo/Vendor)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DISCOVERY DASHBOARD                             │
│  • View all discovered assets                               │
│  • See statistics (total, potential, confirmed, linked)     │
│  • Review asset details                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ASSET REVIEW & ACTION                           │
│  User selects action for each asset:                       │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │  Link    │  Create  │  Shadow  │ Resolve  │            │
│  └────┬─────┴────┬─────┴────┬─────┴────┬──────┘            │
│       │          │          │          │                    │
│       ▼          ▼          ▼          ▼                    │
│   Link to    Create New  Mark as    Mark as                │
│   Existing   System      Shadow AI  False Positive          │
│   System                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              GOVERNANCE & COMPLIANCE                         │
│  • Shadow AI blocks compliance approvals                   │
│  • Warning banners displayed                               │
│  • Audit trail maintained                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step User Guide

### Step 1: Access Discovery Dashboard

1. Navigate to `/discovery` in your browser
2. You'll see the **AI Asset Discovery** dashboard with:
   - Header: "AI Asset Discovery" with subtitle
   - **"Add Discovery"** button (top right)
   - Four statistics cards showing:
     - Total Discovered
     - Potential Shadow AI
     - Confirmed Shadow AI
     - Linked Assets
   - **Discovered Assets** table (initially empty if no discoveries)

### Step 2: Add a Discovery

**Click "Add Discovery" button**

A dialog opens with the following fields:

1. **Source Type** (Required)
   - Select from dropdown:
     - API Endpoint Detection
     - Repository Signal
     - Vendor Usage Declaration
     - Manual Hint

2. **Detected Name** (Required)
   - Enter the name of the discovered AI asset
   - Example: "OpenAI Chat Completion API"

3. **Description** (Optional)
   - Provide additional context about the asset
   - Example: "Used in customer service chatbot"

4. **Vendor** (Optional)
   - Select from dropdown:
     - OpenAI
     - Anthropic
     - AWS
     - Azure
     - Custom
     - Unknown

5. **Endpoint/Repository URL** (Optional)
   - For API Endpoint: `https://api.openai.com/v1/...`
   - For Repository: `https://github.com/company/repo`
   - For Vendor: Leave empty or enter vendor URL

6. **Confidence** (Required, Default: Medium)
   - Low: Uncertain if this is an AI system
   - Medium: Likely an AI system
   - High: Confident this is an AI system

7. **Environment** (Optional)
   - Development
   - Test
   - Production
   - Unknown

**Click "Add Discovery"** to submit.

**What Happens:**
- A new `discovered_ai_asset` record is created
- `shadow_status` is set to `'potential'` (default)
- A `discovery_events` record is created with `event_type: 'detected'`
- The dashboard refreshes to show the new asset
- Statistics update automatically

### Step 3: Review Discovered Assets

The **Discovered Assets** table shows:

- **Name**: The detected name of the asset
- **Vendor**: AI vendor (if known)
- **Source**: Badge showing source type (repo_scan, api_scan, etc.)
- **Confidence**: Badge showing confidence level (low/medium/high)
- **Environment**: Where the asset is used (dev/test/prod)
- **Shadow Status**: Badge showing current status:
  - 🟡 **Potential**: Not yet reviewed
  - 🔴 **Confirmed Shadow AI**: Confirmed as unregistered
  - 🟢 **Resolved**: Linked or marked as false positive
- **Linked System**: Shows system ID if linked, or "—" if not
- **Actions**: Four action buttons (explained below)

### Step 4: Take Action on Discovered Asset

For each discovered asset, you have four action options:

#### Action 1: Link to Existing System

**When to Use:**
- The discovered asset corresponds to an **existing registered AI system** in SeekCompliance
- You want to associate the discovery with that system

**How to Use:**
1. Click the **"Link"** button
2. A prompt appears asking for the **AI System ID**
3. Enter the system ID (e.g., from EU AI Act assessment, MAS assessment, UK assessment, or registry)
4. Click OK

**What Happens:**
- System validates that the system ID exists
- `linked_system_id` is updated with the provided ID
- `shadow_status` changes from `'potential'` → `'resolved'`
- `last_seen_at` timestamp is updated
- A `discovery_events` record is created with:
  - `event_type: 'linked'`
  - `performed_by: [your user ID]`
  - `notes: "Linked to system [system_id]"`
- UI updates:
  - "Linked System" column shows the system ID (clickable link)
  - "Potential Shadow AI" count decreases
  - "Linked Assets" count increases
  - Link/Create buttons disappear (asset is now linked)

**Result:** Asset is now accounted for and linked to a registered system. No longer considered Shadow AI.

---

#### Action 2: Create New System

**When to Use:**
- The discovered asset is a **legitimate AI system** that needs to be registered
- It doesn't correspond to any existing registered system
- You want to create a formal registration for it

**How to Use:**
1. Click the **"Create"** button
2. A prompt appears asking for **System Name** (required)
3. Enter the system name, then click OK
4. A prompt appears asking for **Description** (optional)
5. Enter description or click Cancel to skip
6. A prompt appears asking for **Owner** (optional)
7. Enter owner or click Cancel to skip

**What Happens:**
- A new AI system is created in `eu_ai_act_check_results` table
- The new system has:
  - Basic information (name, description, owner)
  - Default compliance status: `'pending'`
  - Risk tier: `'unknown'`
  - Reference field linking back to the discovery asset
- `linked_system_id` is updated with the new system's ID
- `shadow_status` changes from `'potential'` → `'resolved'`
- A `discovery_events` record is created with:
  - `event_type: 'linked'`
  - `performed_by: [your user ID]`
  - `notes: "Created new AI system from discovered asset: [system_id]"`
- UI updates:
  - "Linked System" column shows the new system ID
  - "Potential Shadow AI" count decreases
  - "Linked Assets" count increases
  - You are redirected to the new system's detail page (`/ai-systems/[id]`)
  - Link/Create buttons disappear

**Result:** A new registered AI system is created, and the discovered asset is linked to it. You can now complete compliance assessments for this system.

---

#### Action 3: Mark as Shadow AI

**When to Use:**
- After review, the discovered asset is confirmed to be **unregistered and unauthorized AI usage**
- It represents actual Shadow AI that needs governance attention
- You want to flag it to block compliance approvals

**How to Use:**
1. Click the **"Shadow"** button
2. A prompt appears asking for **Notes** (optional)
3. Enter notes explaining why this is Shadow AI, or click Cancel to skip
4. Click OK

**What Happens:**
- `shadow_status` changes from `'potential'` → `'confirmed'`
- `last_seen_at` timestamp is updated
- A `discovery_events` record is created with:
  - `event_type: 'marked_shadow'`
  - `performed_by: [your user ID]`
  - `notes: [your notes or "Confirmed as Shadow AI"]`
- UI updates:
  - Shadow Status badge turns red: **"Confirmed Shadow AI"** with warning icon
  - "Potential Shadow AI" count decreases
  - "Confirmed Shadow AI" count increases
  - Shadow button disappears (already confirmed)
- **Governance Impact:**
  - If this asset is later linked to a system, that system's risk assessment approvals will be **blocked**
  - Warning banner appears on main dashboard: "Unregistered AI usage detected: X confirmed Shadow AI system(s)"
  - Compliance workflows show warnings

**Result:** Asset is marked as confirmed Shadow AI. This triggers governance rules that block compliance approvals until resolved.

**Permissions:** Only system owners or admins can mark assets as Shadow AI.

---

#### Action 4: Resolve (Mark as False Positive)

**When to Use:**
- The discovered asset is **not actually an AI system** (false positive)
- It's a duplicate entry
- It's no longer relevant or has been handled outside the system
- You want to mark it as resolved without linking it

**How to Use:**
1. Click the **"Resolve"** button
2. A prompt appears asking for **Resolution Notes** (optional)
3. Enter notes explaining why this is resolved, or click Cancel to skip
4. Click OK

**What Happens:**
- `shadow_status` changes from `'potential'` → `'resolved'`
- `linked_system_id` remains `null` (not linked)
- `last_seen_at` timestamp is updated
- A `discovery_events` record is created with:
  - `event_type: 'resolved'`
  - `performed_by: [your user ID]`
  - `notes: [your notes or "Resolved as false positive or no longer relevant"]`
- UI updates:
  - Shadow Status badge turns green: **"Resolved"** with checkmark icon
  - "Potential Shadow AI" count decreases
  - Asset may be filtered out of active "Potential" views
  - Resolve button disappears

**Result:** Asset is marked as resolved. It's no longer considered potential Shadow AI and doesn't require action.

**Permissions:** Only system owners or admins can resolve assets.

---

### Step 5: Monitor Shadow AI Impact

Once assets are marked as **Confirmed Shadow AI**, the governance system activates:

1. **Dashboard Warning Banner**
   - Appears on the main compliance dashboard (`/dashboard`)
   - Shows: "Unregistered AI usage detected: X confirmed Shadow AI system(s). Compliance approvals may be blocked."
   - Includes link to Discovery Dashboard

2. **Compliance Approval Blocking**
   - When attempting to approve a risk assessment (`POST /api/risk-assessments/[id]/approve`)
   - System checks if the AI system has any linked confirmed Shadow AI
   - If found, approval is **blocked** with error:
     ```
     "Cannot approve: X confirmed Shadow AI system(s) detected. 
     Please resolve Shadow AI issues before approval."
     ```
   - User must resolve Shadow AI before compliance can proceed

3. **Audit Trail**
   - All actions are logged in `discovery_events` table
   - Includes: who, what, when, and notes
   - Supports compliance audits and reporting

---

## Governance & Compliance Impact

### Shadow AI Governance Rules

1. **Blocking Compliance Approvals**
   - Risk assessment approvals are blocked if the system has confirmed Shadow AI
   - Prevents organizations from claiming compliance while using unregistered AI

2. **Warning System**
   - Visual warnings on dashboards
   - Alert banners for administrators
   - Clear indication of compliance risks

3. **Audit Requirements**
   - Complete audit trail of all discovery actions
   - Tracks who discovered what and when
   - Supports regulatory reporting requirements

### Compliance Workflow Integration

```
┌─────────────────────────────────────────┐
│  User attempts to approve risk          │
│  assessment for AI System X             │
└──────────────────┬──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  System checks for Shadow AI:           │
│  • Query discovered_ai_assets           │
│  • Filter: linked_system_id = System X  │
│  • Filter: shadow_status = 'confirmed'  │
└──────────────────┬──────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    Shadow AI Found?      No Shadow AI
         │                     │
         ▼                     ▼
    BLOCK APPROVAL      ALLOW APPROVAL
    (403 Error)         (200 Success)
         │
         ▼
    User must resolve
    Shadow AI first
```

---

## Technical Architecture

### Database Schema

#### Table: `discovered_ai_assets`
- Stores all discovered AI assets
- Key fields:
  - `id`: UUID primary key
  - `source_type`: How it was discovered
  - `detected_name`: Name of the asset
  - `detected_vendor`: AI vendor
  - `detected_endpoint_or_repo`: URL or endpoint
  - `confidence_score`: Low/Medium/High
  - `environment`: Dev/Test/Prod/Unknown
  - `linked_system_id`: Reference to registered system (nullable)
  - `shadow_status`: Potential/Confirmed/Resolved
  - `created_by`: User who discovered it
  - `metadata`: JSONB for additional data

#### Table: `discovery_events`
- Audit trail of all discovery actions
- Key fields:
  - `id`: UUID primary key
  - `discovered_asset_id`: Reference to asset
  - `event_type`: Detected/Linked/Marked_Shadow/Resolved
  - `performed_by`: User who performed action
  - `notes`: Optional notes
  - `timestamp`: When action occurred

### API Endpoints

- `GET /api/discovery` - List all discovered assets with statistics
- `POST /api/discovery` - Create new discovered asset
- `GET /api/discovery/[id]` - Get specific asset with events
- `PUT /api/discovery/[id]` - Update asset
- `DELETE /api/discovery/[id]` - Delete asset (admin only)
- `POST /api/discovery/[id]/link` - Link to existing system
- `POST /api/discovery/[id]/mark-shadow` - Mark as Shadow AI
- `POST /api/discovery/[id]/resolve` - Resolve as false positive
- `POST /api/discovery/[id]/create-system` - Create new system from asset

### Frontend Components

- `/discovery` - Main discovery dashboard page
- `AddDiscoveryDialog` - Dialog for adding new discoveries
- Statistics cards showing key metrics
- Table view with action buttons
- Warning banners for Shadow AI

### Integration Points

- **Risk Assessment Approval**: Checks for Shadow AI before allowing approval
- **Compliance Dashboard**: Shows Shadow AI warnings
- **AI System Registry**: Links discovered assets to registered systems
- **Audit System**: Logs all discovery events

---

## Best Practices

### Discovery Management

1. **Regular Reviews**
   - Review discovered assets regularly (weekly/monthly)
   - Prioritize high-confidence assets in production environments

2. **Clear Documentation**
   - Always add notes when marking Shadow AI or resolving assets
   - Document why an asset is or isn't Shadow AI

3. **Systematic Linking**
   - Link discovered assets to registered systems promptly
   - Create new system registrations for legitimate unregistered systems

4. **Governance Follow-up**
   - Resolve confirmed Shadow AI issues before compliance deadlines
   - Maintain audit trail for regulatory reporting

### Compliance Workflow

1. **Before Compliance Assessment**
   - Review Discovery Dashboard for potential Shadow AI
   - Link or create systems for discovered assets
   - Resolve false positives

2. **During Compliance Assessment**
   - If Shadow AI is detected, resolve it before approval
   - Document resolution in discovery events

3. **After Compliance Assessment**
   - Continue monitoring for new discoveries
   - Maintain complete audit trail

---

## Summary

The **AI Asset Discovery & Shadow AI Detection** feature provides organizations with:

✅ **Visibility** into all AI systems in use  
✅ **Governance** over unregistered AI usage  
✅ **Compliance** protection through blocking mechanisms  
✅ **Audit Trail** for regulatory reporting  
✅ **Workflow** to register or resolve discovered assets  

This ensures organizations maintain **regulatory compliance** and have **full control** over their AI landscape.
