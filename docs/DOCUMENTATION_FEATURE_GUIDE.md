# Automated Compliance Documentation Feature Guide

## Overview

The Automated Compliance Documentation feature generates regulation-specific compliance documentation for your AI systems using OpenAI GPT-4o. It automatically gathers system data and approved risk assessments to create comprehensive documentation aligned with EU AI Act, UK AI Act, or MAS regulations.

---

## Prerequisites

1. **Database Migration**: Run the migration file in Supabase:
   ```sql
   -- Execute: supabase/migrations/create_compliance_documentation.sql
   ```

2. **System Requirements**:
   - An AI system must exist (EU AI Act, UK AI Act, or MAS assessment)
   - At least one approved risk assessment (recommended, but not required)
   - OpenAI API key configured in environment variables

---

## Feature Flow

### Understanding the Two Different "Detailed" Flows

**Important**: There are two separate features that both use the word "Detailed":

1. **"Detailed Assessment"** (Existing Feature):
   - Button: "+ Run Detailed" in the dashboard's DETAILED column
   - Route: `/compliance/detailed/[id]`
   - Purpose: Create a detailed compliance assessment questionnaire
   - This is for **inputting** detailed compliance data

2. **"Documentation"** (New Feature):
   - Tab: "Documentation" in the AI System detail page
   - Route: `/ai-systems/[id]` → Documentation tab
   - Purpose: Generate compliance documentation from existing assessment data
   - This is for **outputting** documentation based on assessment results

**How They Work Together**:
```
Dashboard → "+ Run Detailed" → Detailed Assessment Form → Complete Assessment
                                                                    ↓
Dashboard → "View details" → AI System Detail Page → Documentation Tab → Generate Documentation
```

### Step 1: Access the Documentation Tab

1. Navigate to any AI System detail page:
   - Go to `/dashboard`
   - Click on any system's **"View details"** button (in ACTIONS column)
   - Or navigate directly to `/ai-systems/[system-id]`
   
   > **Note**: The "View details" button is different from the "+ Run Detailed" button. 
   > - "+ Run Detailed" → Creates detailed assessment (`/compliance/detailed/[id]`)
   > - "View details" → Shows system detail page with tabs (`/ai-systems/[id]`)

2. Click on the **"Documentation"** tab in the system detail page

### Step 2: Generate Documentation

1. **Select Regulation Type**:
   - Choose from the dropdown:
     - `EU AI Act` - For EU AI Act compliance
     - `UK AI Act` - For UK AI Regulatory Framework
     - `MAS` - For MAS (Singapore) AI Risk Management Guidelines
   
   > **Note**: The dropdown only shows regulations that match your system type. If your system is an EU AI Act assessment, only "EU AI Act" will be available.

2. **Click "Generate Documentation"**:
   - The system will:
     - Gather system metadata from the compliance assessment
     - Fetch all approved risk assessments
     - Send structured data to OpenAI GPT-4o
     - Generate regulation-specific documentation
     - Save the document with version 1.0
     - Mark any previous documents as "outdated"

3. **Wait for Generation** (typically 10-30 seconds):
   - A loading spinner appears
   - The document is generated using LLM
   - Success message shows the new version number

### Step 3: View Generated Documentation

After generation, you'll see:

1. **Documentation List**:
   - Documents grouped by regulation type
   - Each document shows:
     - **Version** (e.g., v1.0, v1.1, v2.0)
     - **Status Badge**:
       - 🟢 **Current** - Latest version, up-to-date
       - 🟡 **Outdated** - Newer version exists or system data changed
     - **Generated Date/Time**
     - **Action Buttons**: View, Download, Regenerate

2. **View Documentation**:
   - Click **"View"** button
   - Opens full document in a modal
   - Formatted markdown display
   - Scrollable content
   - **Download** button available in viewer

3. **Download Documentation**:
   - Click **"Download"** button (or from viewer)
   - Downloads as `.md` (Markdown) file
   - Filename format: `{Regulation_Type}_v{version}_{id}.md`
   - Example: `EU_AI_Act_v1.0_a1b2c3d4.md`

### Step 4: Regenerate Documentation

When system data changes:

1. **Automatic Outdated Status**:
   - When you generate a new version, old versions are automatically marked as "outdated"
   - Outdated documents are preserved for history

2. **Manual Regeneration**:
   - Click **"Regenerate"** button on outdated documents
   - Or generate a new document from the form
   - New version number is auto-incremented (1.0 → 1.1 → 1.2, etc.)

---

## Complete User Flow Diagram

### Full Workflow: From Assessment to Documentation

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD (/dashboard)                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│ │ + Run        │  │ ▲ Check      │  │ View details│      │
│ │ Detailed    │  │ Assessment   │  │             │      │
│ └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│        │                                    │               │
│        │ (Creates detailed assessment)      │ (Goes to      │
│        │                                    │  system page) │
│        ▼                                    ▼               │
│ ┌──────────────────┐            ┌────────────────────────┐ │
│ │ /compliance/     │            │ /ai-systems/[id]       │ │
│ │ detailed/[id]    │            │                        │ │
│ │                  │            │ Tabs:                  │ │
│ │ Detailed         │            │ - Overview             │ │
│ │ Assessment Form  │            │ - Risk Assessments    │ │
│ │                  │            │ - Compliance          │ │
│ │ (Input data)     │            │ - Documentation ←───┐ │ │
│ └──────────────────┘            └──────────────────────┼─┘ │
│                                                          │   │
│                                                          │   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│ DOCUMENTATION TAB                                            │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 1. Select Regulation Type                            │    │
│ │    - EU AI Act / UK AI Act / MAS                     │    │
│ └────────────────────┬─────────────────────────────────┘    │
│                      │                                        │
│                      ▼                                        │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 2. Click "Generate Documentation"                     │    │
│ └────────────────────┬─────────────────────────────────┘    │
│                      │                                        │
│                      ▼                                        │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 3. Backend Processing                                 │    │
│ │    ├─ Gather system data (from assessment)           │    │
│ │    ├─ Fetch approved risk assessments                │    │
│ │    ├─ Build regulation-specific prompt               │    │
│ │    ├─ Call OpenAI GPT-4o                             │    │
│ │    ├─ Generate documentation                         │    │
│ │    ├─ Determine version number                       │    │
│ │    ├─ Mark old docs as outdated                      │    │
│ │    └─ Save new document                              │    │
│ └────────────────────┬─────────────────────────────────┘    │
│                      │                                        │
│                      ▼                                        │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 4. Document Appears in List                          │    │
│ │    - Version number (e.g., v1.0)                    │    │
│ │    - Status: Current                                │    │
│ │    - Generated timestamp                             │    │
│ └────────────────────┬─────────────────────────────────┘    │
│                      │                                        │
│                      ▼                                        │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 5. User Actions Available                            │    │
│ │    ├─ View: Opens document in modal                  │    │
│ │    ├─ Download: Exports as .md file                  │    │
│ │    └─ Regenerate: Creates new version                │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Distinction

**"Detailed Assessment" Flow** (Input):
- Purpose: **Create** detailed compliance assessment
- Location: Dashboard → "+ Run Detailed" button
- Route: `/compliance/detailed/[id]`
- Action: Fill out detailed questionnaire
- Result: Detailed assessment data saved

**"Documentation" Flow** (Output):
- Purpose: **Generate** documentation from assessment data
- Location: AI System Detail Page → "Documentation" tab
- Route: `/ai-systems/[id]` → Documentation tab
- Action: Generate documentation using LLM
- Result: Compliance documentation document

---

## What Data is Used for Generation?

### For EU AI Act Documentation:
- System name
- Risk tier classification
- Compliance status
- Lifecycle stage
- Accountable person
- Prohibited practices detected
- High-risk obligations status
- Missing obligations
- Transparency requirements
- Post-market monitoring status
- FRIA completion status
- Approved risk assessments (all categories)

### For UK AI Act Documentation:
- System name
- Risk level
- Overall assessment
- Sector information
- UK AI Principles status:
  - Safety & Security
  - Transparency
  - Fairness
  - Governance
  - Contestability
- Approved risk assessments

### For MAS Documentation:
- System name
- Sector
- Overall risk level
- Overall compliance status
- Owner information
- System status
- Data usage flags (personal data, special category, third-party)
- All 12 MAS pillars assessment:
  - Governance
  - Inventory
  - Data Management
  - Transparency
  - Fairness
  - Human Oversight
  - Third-Party Management
  - Algorithm Selection
  - Evaluation & Testing
  - Technology & Cybersecurity
  - Monitoring & Change Management
  - Capability & Capacity
- Approved risk assessments

---

## Version Management

### Version Numbering:
- **First document**: `1.0`
- **Subsequent versions**: Auto-incremented minor version
  - `1.0` → `1.1` → `1.2` → `1.3` (when regenerating)
  - Major version increments can be done manually if needed

### Status Management:
- **Current**: Latest version, reflects current system state
- **Outdated**: 
  - Automatically set when new version is generated
  - Preserved for audit trail
  - Can be regenerated with one click

---

## Example Use Cases

### Use Case 1: Initial Documentation Generation
**Scenario**: You've completed an EU AI Act assessment and want to generate technical documentation.

1. Navigate to the system detail page
2. Go to Documentation tab
3. Select "EU AI Act"
4. Click "Generate Documentation"
5. Wait ~15 seconds
6. View the generated document
7. Download for your records

**Result**: You have a comprehensive technical documentation aligned with EU AI Act Article 11 requirements.

---

### Use Case 2: Updating Documentation After Changes
**Scenario**: You've updated risk assessments and want fresh documentation.

1. Navigate to Documentation tab
2. See existing document marked as "Outdated"
3. Click "Regenerate" button
4. New version (e.g., v1.1) is generated
5. Old version (v1.0) remains in history

**Result**: You have updated documentation reflecting latest system state, with full version history.

---

### Use Case 3: Multi-Regulation Documentation
**Scenario**: Your system is assessed against multiple regulations.

1. Generate EU AI Act documentation → v1.0
2. Generate UK AI Act documentation → v1.0
3. Generate MAS documentation → v1.0

**Result**: Three separate documents, each aligned with its specific regulation, all accessible from the same tab.

---

## Best Practices

1. **Generate After Major Updates**:
   - After completing risk assessments
   - After lifecycle stage changes
   - After compliance status updates

2. **Review Before Download**:
   - Always view the document first
   - Verify it contains expected information
   - Check for accuracy

3. **Maintain Version History**:
   - Don't delete old versions
   - Use version numbers for tracking
   - Download important versions

4. **Regular Regeneration**:
   - Regenerate when system data changes significantly
   - Keep documentation current for audits
   - Use outdated badges as reminders

---

## Troubleshooting

### Issue: "No [Regulation] assessment found for this system"
**Solution**: Ensure you have completed an assessment for that regulation type. The system ID must match an existing assessment.

### Issue: Documentation generation fails
**Solution**: 
- Check OpenAI API key is configured
- Verify you have approved risk assessments (recommended)
- Check system data is complete

### Issue: Can't see Documentation tab
**Solution**: 
- Ensure you're on the AI System detail page (`/ai-systems/[id]`)
- This is different from the "Detailed Assessment" page (`/compliance/detailed/[id]`)
- Use the "View details" button from dashboard, NOT the "+ Run Detailed" button
- Check the tab is visible (should be after Overview, Risk Assessments, Compliance)

### Issue: Confused about "Detailed" vs "Documentation"
**Solution**: 
- **"+ Run Detailed"** button → Creates detailed assessment (input form)
- **"View details"** button → Shows system page with Documentation tab (output generation)
- Documentation feature uses data FROM the detailed assessment you created

### Issue: Old documents not marked as outdated
**Solution**: This happens automatically when generating new versions. If it doesn't, try regenerating.

---

## Technical Details

### API Endpoints:
- `GET /api/ai-systems/[id]/documentation` - List all documentation
- `POST /api/ai-systems/[id]/documentation` - Generate new documentation

### Database Table:
- `compliance_documentation` - Stores all generated documents

### LLM Model:
- OpenAI GPT-4o
- Temperature: 0.3 (for consistency)
- System prompt: Expert compliance documentation writer

### Document Format:
- Markdown format
- Regulation-specific structure
- Professional formatting
- Ready for export/download

---

## Security & Access Control

- **RLS Policies**: Users can only see/edit their own documentation
- **Authentication Required**: Must be logged in
- **Audit Trail**: All documents track creator and creation time
- **Version History**: Preserved for compliance and audit purposes

---

## Next Steps

1. **Run the Migration**: Execute the SQL migration in Supabase
2. **Test the Feature**: Generate documentation for an existing system
3. **Review Output**: Check the generated documentation quality
4. **Integrate Workflow**: Add documentation generation to your compliance process

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the API route code: `app/api/ai-systems/[id]/documentation/route.ts`
- Check the UI component: `app/ai-systems/[id]/components/Documentation/DocumentationTab.tsx`
