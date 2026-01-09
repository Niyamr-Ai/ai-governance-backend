# EU AI Act Governance Platform - Complete Architecture Documentation

## Project Overview

**EU AI Act Governance Platform** is a comprehensive AI compliance and governance management system designed to help organizations manage AI systems across multiple regulatory frameworks including EU AI Act, UK AI Act, and MAS (Monetary Authority of Singapore) regulations.

### Key Objectives
- Centralized AI system inventory and registry
- Multi-regulatory compliance assessment (EU, UK, MAS)
- Risk assessment and management
- Automated documentation generation
- Lifecycle governance tracking
- Shadow AI discovery and management
- Red teaming and adversarial testing
- Policy tracking and regulatory mapping

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.8 (React 18.3.1)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Markdown**: Marked

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL (via Supabase)
- **ORM/Query Builder**: Knex.js
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI API (GPT-4o)
- **Vector Database**: Pinecone (for semantic search)
- **Caching**: Redis (optional)

### Infrastructure
- **Database Hosting**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (if used)
- **Deployment**: Vercel (configured via vercel.json)
- **Cron Jobs**: Vercel Cron (for scheduled tasks)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                       │
│  (Next.js React Application - Server & Client Components)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (React Components)                         │   │
│  │  - Pages (app/*)                                     │   │
│  │  - Components (components/*)                         │   │
│  │  - UI Library (components/ui/*)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes (app/api/*)                              │   │
│  │  - RESTful endpoints                                 │   │
│  │  - Server-side logic                                 │   │
│  │  - Business logic (lib/*)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌─────────▼─────────┐
│   Supabase      │    │   OpenAI API      │
│   - PostgreSQL  │    │   - GPT-4o        │
│   - Auth        │    │   - Embeddings    │
│   - Storage     │    └───────────────────┘
└─────────────────┘
         │
┌────────▼────────┐
│   Pinecone      │
│   (Vector DB)   │
└─────────────────┘
```

---

## Frontend Architecture

### Page Structure

#### Public Pages
- **`/`** - Landing page with marketing content
- **`/sign-in`** - User authentication (login)
- **`/sign-up`** - User registration
- **`/forgot-password`** - Password recovery

#### Protected Pages (Require Authentication)
- **`/dashboard`** - Main compliance dashboard (unified view)
- **`/discovery`** - Shadow AI discovery and management
- **`/documentation`** - Compliance documentation hub
- **`/policy-tracker`** - Policy tracking and regulatory mapping
- **`/red-teaming`** - AI red teaming and adversarial testing
- **`/assessment`** - Compliance assessment form
- **`/compliance/[id]`** - EU AI Act compliance details
- **`/compliance/detailed/[id]`** - Detailed compliance assessment
- **`/mas/[id]`** - MAS compliance details
- **`/mas/dashboard`** - MAS dashboard
- **`/uk/[id]`** - UK AI Act compliance details
- **`/uk/dashboard`** - UK AI Act dashboard
- **`/ai-systems/[id]`** - AI system detail page with tabs:
  - Overview
  - Risk Assessments
  - Documentation
  - Policies
  - Tasks
  - Automated Risk Assessment

### Component Architecture

#### Layout Components
- **`components/sidebar.tsx`** - Main navigation sidebar
- **`components/landing/Navbar.tsx`** - Landing page navigation
- **`components/landing/Footer.tsx`** - Footer component

#### UI Components (`components/ui/*`)
- Button, Card, Dialog, Table, Badge, Select, Input, Textarea
- Toast notifications, Alert, Tabs, Accordion
- All built on Radix UI primitives with Tailwind styling

#### Feature Components
- **Risk Assessments**: `app/ai-systems/[id]/components/RiskAssessments/*`
- **Documentation**: `app/ai-systems/[id]/components/Documentation/*`
- **Policies**: `app/ai-systems/[id]/components/Policies/*`
- **Tasks**: `app/ai-systems/[id]/components/Tasks/*`

### State Management
- **Local State**: React hooks (useState, useEffect)
- **Server State**: Fetch API calls to Next.js API routes
- **Context**: AccountContext for user account information
- **Form State**: React Hook Form with Zod validation

### Styling Approach
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theme**: Defined in `tailwind.config.ts`
- **Component Variants**: Using `class-variance-authority` (CVA)
- **Dark Mode**: Supported via `next-themes` (if implemented)

---

## Backend Architecture

### API Routes Structure

All API routes are located in `app/api/*` and follow Next.js 16 App Router conventions.

#### Core API Endpoints

**Compliance APIs**
- `GET /api/compliance` - List all EU AI Act assessments
- `GET /api/compliance/[id]` - Get specific EU assessment
- `POST /api/compliance` - Create new EU assessment
- `GET /api/compliance/detailed` - List detailed assessments
- `POST /api/compliance/detailed` - Create detailed assessment

**MAS Compliance APIs**
- `GET /api/mas-compliance` - List all MAS assessments
- `GET /api/mas-compliance/[id]` - Get specific MAS assessment
- `POST /api/mas-compliance` - Create new MAS assessment

**UK Compliance APIs**
- `GET /api/uk-compliance` - List all UK assessments
- `GET /api/uk-compliance/[id]` - Get specific UK assessment
- `POST /api/uk-compliance` - Create new UK assessment

**AI Systems APIs**
- `GET /api/ai-systems/list` - List all AI systems
- `GET /api/ai-systems/[id]/compliance-data` - Get compliance data for system
- `GET /api/ai-systems/[id]/risk-assessments` - Get risk assessments
- `GET /api/ai-systems/[id]/documentation` - Get documentation
- `GET /api/ai-systems/[id]/lifecycle` - Get lifecycle stage
- `GET /api/ai-systems/[id]/overall-risk` - Calculate overall risk
- `GET /api/ai-systems/[id]/policies` - Get policy mappings
- `GET /api/ai-systems/[id]/tasks` - Get governance tasks
- `GET /api/ai-systems/[id]/automated-risk-assessment` - Get automated assessments
- `POST /api/ai-systems/[id]/automated-risk-assessment/[assessmentId]/approve` - Approve assessment

**Risk Assessment APIs**
- `GET /api/risk-assessments/[id]` - Get risk assessment
- `POST /api/risk-assessments/[id]` - Create risk assessment
- `PUT /api/risk-assessments/[id]` - Update risk assessment
- `POST /api/risk-assessments/[id]/submit` - Submit for review
- `POST /api/risk-assessments/[id]/approve` - Approve assessment
- `POST /api/risk-assessments/[id]/reject` - Reject assessment
- `PUT /api/risk-assessments/[id]/mitigation-status` - Update mitigation status

**Documentation APIs**
- `GET /api/documentation` - List all documentation
- `POST /api/documentation` - Generate new documentation
- `GET /api/ai-systems/[id]/documentation` - Get system documentation

**Discovery APIs**
- `GET /api/discovery` - List discovered AI systems
- `GET /api/discovery/[id]` - Get specific discovery
- `POST /api/discovery/[id]/create-system` - Create system from discovery
- `POST /api/discovery/[id]/link` - Link to existing system
- `POST /api/discovery/[id]/mark-shadow` - Mark as shadow AI
- `POST /api/discovery/[id]/resolve` - Resolve discovery

**Red Teaming APIs**
- `GET /api/red-teaming` - List red teaming results
- `POST /api/red-teaming` - Run red teaming tests

**Policy APIs**
- `GET /api/policies` - List policies
- `GET /api/policies/[id]` - Get specific policy
- `GET /api/policies/[id]/requirements` - Get policy requirements
- `GET /api/ai-systems/[id]/policies` - Get system policy mappings

**Governance Tasks APIs**
- `GET /api/ai-systems/[id]/tasks` - Get governance tasks
- `PUT /api/governance-tasks/[taskId]` - Update task status

**User APIs**
- `GET /api/user/role` - Get current user role

**Cron Jobs**
- `GET /api/cron/regenerate-documentation` - Regenerate outdated documentation
- `GET /api/cron/periodic-risk-review` - Periodic risk review

### Business Logic Layer

Located in `lib/*` directory:

- **`lib/automated-risk-scoring.ts`** - Automated risk scoring algorithms
- **`lib/documentation-auto-generate.ts`** - AI-powered documentation generation
- **`lib/governance-tasks.ts`** - Governance task evaluation
- **`lib/lifecycle-governance.ts`** - Lifecycle stage management
- **`lib/lifecycle-governance-rules.ts`** - Lifecycle transition rules
- **`lib/major-change-detection.ts`** - Detect major system changes
- **`lib/risk-assessment.ts`** - Risk assessment calculations
- **`lib/shadow-ai-governance.ts`** - Shadow AI detection and governance
- **`lib/red-teaming-attacks.ts`** - Red teaming attack library
- **`lib/red-teaming-evaluator.ts`** - Red teaming result evaluation

### Database Access

- **Supabase Client**: `utils/supabase/server.ts` (server-side)
- **Supabase Client**: `utils/supabase/client.ts` (client-side)
- **Knex.js**: `lib/knex.ts` (for complex queries)
- **Direct Queries**: Using Supabase client methods

---

## Database Schema

### Core Tables

#### Compliance Assessment Tables

**`eu_ai_act_check_results`**
- Stores EU AI Act compliance assessments
- Columns: `id`, `system_name`, `risk_tier`, `compliance_status`, `prohibited_practices_detected`, `high_risk_all_fulfilled`, `transparency_required`, `monitoring_required`, `fria_completed`, `accountable_person`, `raw_answers`, `created_at`, `user_id`

**`mas_ai_risk_assessments`**
- Stores MAS (Singapore) compliance assessments
- Columns: `id`, `system_name`, `overall_risk_level`, `overall_compliance_status`, `governance`, `inventory`, `dataManagement`, `transparency`, `fairness`, `humanOversight`, `thirdParty`, `algoSelection`, `evaluationTesting`, `techCybersecurity`, `monitoringChange`, `capabilityCapacity`, `created_at`, `user_id`

**`uk_ai_assessments`**
- Stores UK AI Act compliance assessments
- Columns: `id`, `system_name`, `risk_level`, `overall_assessment`, `safety_and_security`, `transparency`, `fairness`, `governance`, `contestability`, `sector_regulation`, `accountable_person`, `raw_answers`, `created_at`, `user_id`

#### Risk Assessment Tables

**`risk_assessments`**
- Stores manual risk assessments
- Columns: `id`, `ai_system_id`, `assessed_by`, `status` (draft/submitted/approved/rejected), `risk_category`, `risk_level`, `description`, `mitigation_status`, `reviewed_by`, `reviewed_at`, `review_comment`, `created_at`, `updated_at`

#### Automated Risk Assessment Tables

**`automated_risk_assessments`**
- Stores AI-generated risk assessments
- Columns: `id`, `ai_system_id`, `risk_score`, `risk_level`, `assessment_data`, `status` (pending/approved/rejected), `approved_by`, `approved_at`, `created_at`

#### Documentation Tables

**`compliance_documentation`**
- Stores generated compliance documentation
- Columns: `id`, `ai_system_id`, `regulation_type`, `document_type`, `version`, `content`, `status`, `generation_metadata`, `created_by`, `created_at`

#### Discovery Tables

**`discovered_ai_systems`**
- Stores discovered AI systems
- Columns: `id`, `name`, `description`, `discovery_source`, `shadow_status` (pending/confirmed/resolved), `linked_system_id`, `resolved_at`, `created_at`

#### Red Teaming Tables

**`red_teaming_results`**
- Stores red teaming test results
- Columns: `id`, `ai_system_id`, `attack_type`, `attack_prompt`, `system_response`, `test_status` (PASS/FAIL), `risk_level` (LOW/MEDIUM/HIGH), `failure_reason`, `tested_by`, `tested_at`, `created_at`

#### Governance Tables

**`governance_tasks`**
- Stores governance tasks
- Columns: `id`, `ai_system_id`, `title`, `description`, `regulation`, `status` (Pending/Completed/Blocked), `blocking`, `evidence_link`, `related_entity_id`, `related_entity_type`, `created_at`, `completed_at`

**`lifecycle_history`**
- Stores lifecycle stage changes
- Columns: `id`, `ai_system_id`, `from_stage`, `to_stage`, `changed_by`, `changed_at`, `reason`

#### Policy Tables

**`policies`**
- Stores regulatory policies
- Columns: `id`, `name`, `regulation`, `description`, `created_at`

**`policy_mappings`**
- Maps policies to AI systems
- Columns: `id`, `policy_id`, `ai_system_id`, `compliance_status`, `created_at`

#### Registry Tables

**`ai_system_registry`**
- Centralized AI system registry
- Columns: `system_id`, `name`, `description`, `owner`, `status`, `risk_classification`, `created_at`, `updated_at`

### Row Level Security (RLS)

All tables have RLS policies enabled:
- **SELECT**: Authenticated users can view their own data
- **INSERT**: Authenticated users can create records
- **UPDATE**: Users can update their own records; admins can update all
- **DELETE**: Only admins can delete records

---

## Features & Modules

### 1. Compliance Assessment Module

**EU AI Act Compliance**
- Risk tier classification (Prohibited, High-risk, Limited-risk, Minimal-risk)
- High-risk obligations checking
- Transparency requirements assessment
- Post-market monitoring tracking
- FRIA (Fundamental Rights Impact Assessment) tracking
- Detailed compliance questionnaire

**MAS Compliance**
- 12-pillar assessment framework
- Compliance scoring (0-100 per pillar)
- Gap identification and recommendations
- Overall risk level calculation

**UK AI Act Compliance**
- 5 UK AI principles assessment
- Sector-specific regulation mapping
- Risk level classification
- Overall compliance status

### 2. Risk Assessment Module

**Manual Risk Assessments**
- Risk categories: Bias & Fairness, Robustness & Performance, Privacy & Data Leakage, Explainability
- Risk levels: Low, Medium, High, Critical
- Workflow: Draft → Submitted → Approved/Rejected
- Mitigation status tracking
- Overall risk calculation per system

**Automated Risk Assessments**
- AI-powered risk scoring using OpenAI
- Automatic risk level assignment
- Approval workflow
- Integration with system data

### 3. Documentation Module

**Automated Documentation Generation**
- AI-powered documentation using GPT-4o
- Regulation-specific templates (EU, UK, MAS)
- Document types: AI System Card, Technical Documentation, DPIA, Risk Assessment Report, Algorithm Impact Assessment, Audit Trail, Compliance Summary
- Version control and traceability
- Automatic regeneration for outdated documents

### 4. Discovery Module

**Shadow AI Discovery**
- Discover unregistered AI systems
- Mark as shadow AI
- Link to existing systems
- Create new systems from discoveries
- Resolve discoveries

### 5. Red Teaming Module

**Adversarial Testing**
- Automated attack prompt library
- Attack types: Prompt Injection, Jailbreak, Data Leakage, Policy Bypass
- Rule-based evaluation
- Risk level assignment (LOW/MEDIUM/HIGH)
- System-specific testing
- Results tracking and filtering

### 6. Lifecycle Governance Module

**Lifecycle Stages**
- Draft → Development → Testing → Deployed → Monitoring → Retired
- Stage-based governance rules (EU AI Act)
- Transition validation
- Audit trail for lifecycle changes
- Workflow enforcement

### 7. Policy Tracker Module

**Regulatory Policy Management**
- Policy library
- Policy-to-system mapping
- Compliance status tracking
- Requirement tracking

### 8. Governance Tasks Module

**Task Management**
- Automatic task generation based on compliance gaps
- Regulation-specific tasks (EU, UK, MAS)
- Task status: Pending, Completed, Blocked
- Blocking task identification
- Evidence linking

### 9. Dashboard Module

**Unified Dashboard**
- All compliance assessments in one view
- Statistics and metrics
- Quick actions
- System detail views
- Filtering and search

---

## API Routes

### Authentication Middleware

All protected routes use `getUserId()` from `app/api/helper/auth.ts` to verify authentication.

### Request/Response Patterns

**Standard GET Response**
```typescript
{
  data: T[] | T,
  error?: string
}
```

**Standard POST Response**
```typescript
{
  message: string,
  data?: T,
  error?: string
}
```

### Error Handling

All API routes follow consistent error handling:
- 401: Unauthorized (missing/invalid auth)
- 400: Bad Request (validation errors)
- 404: Not Found
- 500: Internal Server Error

---

## Authentication & Authorization

### Authentication Flow

1. User signs up/signs in via Supabase Auth
2. Session stored in HTTP-only cookies
3. Middleware (`middleware.ts`) validates session on protected routes
4. API routes use `getUserId()` helper to get authenticated user ID

### Authorization

- **Role-based**: User metadata contains `role` field (user/admin/compliance)
- **Resource-based**: Users can only access their own resources (enforced by RLS)
- **Admin Override**: Admins can access all resources

### Protected Routes

Routes requiring authentication:
- `/dashboard`
- `/discovery`
- `/documentation`
- `/policy-tracker`
- `/red-teaming`
- `/ai-systems/*`
- `/compliance/*`
- `/mas/*`
- `/uk/*`

---

## Data Flow

### Typical User Flow

1. **User logs in** → Supabase Auth → Session created
2. **User navigates to dashboard** → `GET /api/compliance` → Fetches all assessments
3. **User clicks system** → `GET /api/ai-systems/[id]/compliance-data` → Fetches system data
4. **User creates risk assessment** → `POST /api/risk-assessments/[id]` → Creates assessment
5. **User submits assessment** → `POST /api/risk-assessments/[id]/submit` → Updates status
6. **Admin approves** → `POST /api/risk-assessments/[id]/approve` → Updates status
7. **User generates documentation** → `POST /api/documentation` → Calls OpenAI → Stores result

### Data Storage Locations

- **PostgreSQL (Supabase)**: All structured data (assessments, risk assessments, documentation, etc.)
- **Supabase Auth**: User accounts and sessions
- **OpenAI**: AI model processing (no data stored)
- **Pinecone**: Vector embeddings for semantic search (if used)
- **Redis**: Caching (optional, if configured)

---

## File Structure

```
eu_ai_act_governance/
├── app/                          # Next.js App Router
│   ├── (auth-pages)/            # Auth-related pages
│   ├── api/                      # API routes
│   │   ├── ai-systems/          # AI system APIs
│   │   ├── compliance/          # Compliance APIs
│   │   ├── discovery/           # Discovery APIs
│   │   ├── documentation/       # Documentation APIs
│   │   ├── red-teaming/         # Red teaming APIs
│   │   └── ...                   # Other APIs
│   ├── ai-systems/[id]/         # AI system detail pages
│   ├── compliance/              # Compliance pages
│   ├── dashboard/               # Dashboard page
│   ├── discovery/               # Discovery page
│   ├── documentation/           # Documentation page
│   ├── red-teaming/             # Red teaming page
│   └── ...                      # Other pages
├── components/                   # React components
│   ├── ui/                      # UI component library
│   ├── landing/                 # Landing page components
│   └── ...                      # Other components
├── lib/                          # Business logic
│   ├── automated-risk-scoring.ts
│   ├── documentation-auto-generate.ts
│   ├── governance-tasks.ts
│   └── ...                      # Other utilities
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
│   └── supabase/                # Supabase client utilities
├── supabase/
│   └── migrations/              # Database migrations
├── hooks/                        # React hooks
├── public/                       # Static assets
├── package.json                  # Dependencies
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---
### Database

**Supabase** (PostgreSQL)
- Managed PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions (if used)
- Storage buckets (if used)

### External Services

- **OpenAI API**: GPT-4o for documentation generation and risk assessment
- **Pinecone**: Vector database for semantic search (if used)
- **Redis**: Caching layer (optional)

### Cron Jobs

Configured in `vercel.json`:
- `0 2 * * *` - Regenerate documentation (daily at 2 AM)
- `0 2 * * *` - Periodic risk review (daily at 2 AM)

---

## Key Design Decisions

### 1. Multi-Regulatory Support
- Separate tables for EU, UK, and MAS assessments
- Unified dashboard view for all regulations
- Regulation-specific business logic in separate modules

### 2. Server-Side Rendering
- Next.js App Router for optimal performance
- Server Components for data fetching
- Client Components only when needed (interactivity)

### 3. Type Safety
- Full TypeScript coverage
- Type definitions in `types/*`
- Zod schemas for runtime validation

### 4. Security
- Row Level Security (RLS) on all tables
- Server-side authentication checks
- No sensitive data in client-side code

### 5. Scalability
- Serverless architecture (Vercel)
- Database indexing on frequently queried columns
- Efficient query patterns

---

## Future Enhancements

Potential areas for expansion:
- Real-time collaboration features
- Advanced analytics and reporting
- Integration with external compliance tools
- Automated compliance monitoring
- Enhanced AI capabilities
- Mobile application
- API for third-party integrations

---

## Maintenance & Support

### Database Migrations
- All migrations in `supabase/migrations/*.sql`
- Run migrations via Supabase Dashboard or CLI
- Always test migrations in development first

### Code Organization
- Feature-based organization in `app/` directory
- Shared components in `components/`
- Business logic in `lib/`
- Type definitions in `types/`

### Testing
- Manual testing recommended for all features
- API endpoints should be tested via Postman/Thunder Client
- Frontend components should be tested in browser

---

**Last Updated**: January 2025
**Version**: 1.0.0

