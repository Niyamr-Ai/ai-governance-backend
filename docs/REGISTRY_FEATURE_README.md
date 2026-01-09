# AI System Registry Feature

## Overview

The AI System Registry is a centralized inventory system for managing all AI systems in your organization. It provides comprehensive tracking of AI systems with governance metadata, technical details, and integration with compliance assessments.

## Database Schema

### Table: `ai_system_registry`

Run the SQL migration file to create the table:
```sql
supabase/migrations/create_ai_system_registry.sql
```

Or execute it directly in your Supabase SQL editor.

## Features Implemented

### 1. API Routes (`/app/api/registry`)

- **GET /api/registry** - List all AI systems with search and filtering
- **POST /api/registry** - Create a new AI system entry
- **GET /api/registry/[id]** - Get detailed information for a specific system
- **PUT /api/registry/[id]** - Update an existing system
- **DELETE /api/registry/[id]** - Delete a system

### 2. Frontend Pages (`/app/registry`)

- **/registry** - Main list page with table view, search, and filters
- **/registry/new** - Create new AI system form
- **/registry/[id]** - Detailed view of a specific system
- **/registry/[id]/edit** - Edit form for updating system information

### 3. UI Components (`/components/registry`)

- **StatusBadge** - Visual indicator for system status (development, staging, production, deprecated)
- **RiskBadge** - Color-coded risk level badges (low, medium, high, prohibited)
- **ComplianceBadge** - Compliance status indicators
- **SearchFilterBar** - Comprehensive search and filter interface

### 4. Integration

- **Compliance Results Page** - Added "Register in Registry" button that pre-fills form with compliance data
- **Registry Detail Page** - Shows linked compliance assessments with navigation buttons

## Usage

### Creating a New AI System

1. Navigate to `/registry/new`
2. Fill in the form sections:
   - **Core Attributes**: Name, description, owner, status, business purpose, risk classification
   - **Technical Attributes**: Model type, framework, hosting, API endpoints, version, etc.
   - **Governance Attributes**: Risk assessment status, compliance status, audit dates, approvals
3. Click "Create System"

### From Compliance Results

1. After completing a compliance check, view the results at `/compliance/[id]`
2. Click "Register in Registry" button
3. The form will be pre-filled with:
   - Basic compliance ID (linked)
   - Risk classification (mapped from compliance result)
   - Compliance status (mapped from compliance result)
4. Complete remaining fields and submit

### Searching and Filtering

On the main registry page (`/registry`), you can:
- Search by name or description
- Filter by:
  - Risk level (low, medium, high, prohibited)
  - Compliance status (compliant, non-compliant, needs review)
  - Owner
  - Model type
  - System status (development, staging, production, deprecated)

### Viewing System Details

1. Click the eye icon or system name in the table
2. View all information organized in sections:
   - Core attributes
   - Technical attributes
   - Governance attributes
   - Linked compliance assessments
3. Use "View Basic Compliance" or "View Detailed Compliance" buttons to navigate to linked assessments

### Editing a System

1. Click the edit icon in the registry table
2. Or navigate to `/registry/[id]/edit`
3. Update any fields
4. Click "Save Changes"

## Data Model

### Core Attributes
- `name` (required) - System name
- `description` - Brief description
- `owner` - Team or individual responsible
- `status` - development | staging | production | deprecated
- `business_purpose` - What problem it solves
- `risk_classification` - low | medium | high | prohibited

### Technical Attributes
- `model_type` - AI model used (e.g., GPT-4, BERT)
- `framework` - Development framework
- `hosting_environment` - Where it's hosted
- `api_endpoints` - API URLs
- `version` - System version
- `training_data_sources` - Data used for training
- `performance_metrics` - KPIs and metrics

### Governance Attributes
- `applicable_regulations` - Array of regulations (e.g., ["EU AI Act", "GDPR"])
- `risk_assessment_status` - done | partial | not_started
- `last_audit_date` - Date of last audit
- `compliance_status` - compliant | non-compliant | needs_review
- `approvals_required` - Array of required approvals
- `approvals_obtained` - Array of obtained approvals
- `documentation_completeness` - Percentage (0-100)

### Relationships
- `basic_compliance_id` - Links to basic compliance check results
- `detailed_compliance_id` - Links to detailed compliance check results

## TypeScript Types

All types are defined in `/types/registry.ts`:
- `AISystemRegistry` - Full system interface
- `CreateAISystemInput` - Input for creating systems
- `UpdateAISystemInput` - Input for updating systems
- `RegistryFilters` - Filter options interface

## Security

- Row Level Security (RLS) is enabled on the table
- All users can read, insert, update, and delete (you may want to restrict this based on your needs)
- API routes check for authenticated users via `getUserId()`

## Next Steps

1. **Run the migration**: Execute the SQL file in Supabase
2. **Test the feature**: Create a test AI system
3. **Customize RLS policies**: Adjust security policies based on your requirements
4. **Add more fields**: Extend the schema if needed for your use case
5. **Enhance UI**: Customize styling and add more visualizations

## Notes

- The registry is separate from compliance checks but can link to them
- When linking compliance results, the system automatically maps risk tiers
- All timestamps are automatically managed (created_at, updated_at)
- User tracking is included (created_by, updated_by)
