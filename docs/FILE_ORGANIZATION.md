# Project File Organization Guide

## Overview

This document provides a simplified approach to organize your EU AI Act Governance Platform files into just two clear folders: **UI** (frontend) and **Backend** (server-side + shared resources). This separation improves maintainability and team collaboration.

## Current Structure Analysis

Your project currently has a mixed structure with files scattered across the root directory. The proposed organization separates concerns based on the Next.js App Router architecture and your platform's AI governance features.

## Proposed Folder Structure (AWS Deployment Ready)

```
/
├── ui/                           # 🎨 Frontend/UI Layer (Standalone Next.js App)
│   ├── components/              # Reusable React components
│   ├── pages/                   # Next.js pages (from app/ except api/)
│   ├── layouts/                 # Layout components
│   ├── styles/                  # CSS and styling files
│   ├── assets/                  # Images, icons, static files
│   ├── hooks/                   # Custom React hooks
│   ├── context/                 # React context providers
│   ├── config/                  # Frontend configuration files
│   ├── types/                   # Frontend TypeScript types
│   ├── utils/                   # Frontend utilities
│   ├── package.json             # UI-specific dependencies
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── .env.local              # UI environment variables
│   ├── .env.example            # UI env template
│   └── .gitignore              # UI-specific gitignore
│
├── backend/                     # 🔧 Backend/Server Layer (Standalone API)
│   ├── api/                     # API routes (from app/api/)
│   ├── services/                # Business logic services
│   ├── database/                # Database migrations and schemas
│   ├── scripts/                 # Utility and automation scripts
│   ├── utils/                   # Backend and shared utilities
│   ├── types/                   # Backend and shared TypeScript types
│   ├── middleware/              # Server middleware
│   ├── config/                  # Backend configuration files
│   ├── package.json             # Backend-specific dependencies
│   ├── tsconfig.json            # Backend TypeScript configuration
│   ├── .env.local              # Backend environment variables
│   ├── .env.example            # Backend env template
│   └── .gitignore              # Backend-specific gitignore
│
├── .gitignore                   # Root gitignore (if keeping monorepo)
└── README.md                    # Project documentation
```

## File Migration Guide (AWS Deployment Ready)

### ⚠️ **Important for AWS Deployment:**
Since you're deploying `ui/` and `backend/` as separate AWS services, you'll need to:

1. **Duplicate configuration files** between both folders
2. **Split dependencies** appropriately in `package.json` files
3. **Set up separate environment variables** for each service
4. **Configure CORS** for cross-service communication

### 📦 **Package.json Strategy:**
- **UI package.json**: Frontend dependencies (React, Next.js, UI libraries)
- **Backend package.json**: API dependencies (database, AI services, utilities)

### 🎨 UI Folder Organization

#### `ui/components/` - React Components
Move all reusable components from `components/`:
```
ui/components/
├── ui/                    # UI library components (shadcn/ui)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── landing/               # Landing page components
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   └── ...
├── chatbot/               # Chatbot components
│   └── Chatbot.tsx
├── tutorial/              # Tutorial components
│   ├── TutorialStep.tsx
│   └── ...
├── form-message.tsx
├── header-auth.tsx
├── hero.tsx
└── ...
```

#### `ui/pages/` - Next.js Pages
Move all page components from `app/` (excluding `api/`):
```
ui/pages/
├── dashboard/
│   ├── page.tsx
│   └── dashboard.css
├── ai-systems/
│   ├── [id]/
│   │   ├── page.tsx
│   │   ├── automated-risk-assessment/
│   │   │   └── page.tsx
│   │   └── components/    # Page-specific components
│   │       ├── Tasks/
│   │       ├── RiskAssessments/
│   │       └── ...
├── compliance/
│   ├── [id]/page.tsx
│   ├── detailed/[id]/page.tsx
│   └── detailed/page.tsx
├── assessment/page.tsx
├── auth-pages/           # Authentication pages
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   └── layout.tsx
├── layout.tsx           # Root layout
├── page.tsx            # Home page
└── ...
```

#### `ui/styles/` - Styling Files
```
ui/styles/
├── globals.css
└── dashboard.css
```

#### `ui/assets/` - Static Assets
```
ui/assets/
├── images/
│   └── logo.png
├── favicon.ico
├── opengraph-image.png
└── twitter-image.png
```

#### `ui/hooks/` - Custom React Hooks
```
ui/hooks/
├── use-mobile.tsx
└── use-toast.ts
```

#### `ui/context/` - React Context Providers
```
ui/context/
└── AccountContext.tsx  # Rename from AccountContaxt.tsx
```

#### `ui/config/` - Frontend Configuration
```
ui/config/
├── components.json      # shadcn/ui configuration
└── assets.json         # Asset configuration
```

### 🔧 Backend Folder Organization

#### `backend/api/` - API Routes
Move all API routes from `app/api/`:
```
backend/api/
├── ai-systems/
│   ├── [id]/
│   │   ├── automated-risk-assessment/
│   │   ├── compliance-data/
│   │   └── ...
│   └── list/
├── compliance/
├── discovery/
├── governance-tasks/
├── red-teaming/
└── ...
```

#### `backend/services/` - Business Logic Services
Move and organize business logic from `lib/`:
```
backend/services/
├── risk-assessment/
│   ├── index.ts
│   ├── guidance.ts
│   └── automated-risk-scoring.ts
├── governance/
│   ├── lifecycle-governance.ts
│   ├── smart-governance-suggestions.ts
│   └── governance-tasks.ts
├── ai/
│   ├── rag-service.ts
│   ├── chatbot/
│   │   ├── intent-classifier.ts
│   │   ├── context-providers.ts
│   │   └── prompts.ts
│   ├── red-teaming/
│   │   ├── red-teaming-attacks.ts
│   │   └── red-teaming-evaluator.ts
│   └── platform-rag-service.ts
├── compliance/
│   ├── smart-policy-compliance.ts
│   ├── shadow-ai-governance.ts
│   └── regulatory-change-impact-analysis.ts
└── documentation/
    └── documentation-auto-generate.ts
```

#### `backend/database/` - Database Layer
```
backend/database/
├── migrations/          # From supabase/migrations/
│   ├── create_risk_assessments.sql
│   ├── add_approval_and_monitoring_to_automated_risk_assessments.sql
│   └── ...
└── schemas/            # Database schemas (if any)
```

#### `backend/scripts/` - Automation Scripts
Move from `scripts/`:
```
backend/scripts/
├── ingest-regulations.ts
├── ingest-platform-knowledge.ts
├── ingest-user-systems.ts
├── test-rag.ts
├── test-user-system-rag.ts
└── test-platform-rag.ts
```

#### `backend/utils/` - Backend Utilities
Move from `utils/`:
```
backend/utils/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── middleware.ts
│   └── check-env-vars.ts
└── utils.ts
```

#### `backend/types/` - Backend TypeScript Types
Move backend-specific types from `types/`:
```
backend/types/
├── risk-assessment.ts
├── governance-task.ts
├── red-teaming.ts
├── discovery.ts
├── chatbot.ts
└── automated-risk-assessment.ts
```

#### `backend/middleware/` - Server Middleware
```
backend/middleware/
├── auth.ts              # From app/api/helper/auth.ts
└── index.ts            # From middleware.ts
```

#### `backend/config/` - Backend Configuration
```
backend/config/
└── vercel.json          # Deployment configuration
```

### 🔄 Shared Resources (Integrated into Backend)

Shared resources like constants and common utilities are now included in the `backend/` folder since they're primarily used by backend services but may be referenced by UI components.

- **Constants**: Application-wide constants (from `lib/constants.ts`) are available in `backend/utils/`
- **Shared Types**: Common types used across both UI and backend layers are in `backend/types/`
- **Shared Utils**: Utility functions that both layers can import are in `backend/utils/`

## Migration Steps

### Phase 1: Create New Structure
```bash
# Create main folders
mkdir -p ui/{components,pages,styles,assets,hooks,context,config,utils}
mkdir -p backend/{api,services,database,migrations,scripts,utils,types,middleware,config}

# Copy root configuration files to both folders
cp package.json ui/
cp package.json backend/
cp next.config.ts ui/
cp tailwind.config.ts ui/
cp tsconfig.json ui/
cp tsconfig.json backend/
cp .env.local ui/
cp .env.local backend/
cp .env.example ui/
cp .env.example backend/
cp .gitignore ui/
cp .gitignore backend/
```

### Phase 1.5: Split Package Dependencies
After copying `package.json` to both folders, edit them to include only relevant dependencies:

**ui/package.json** - Keep frontend dependencies:
```json
{
  "dependencies": {
    "next": "^16.0.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@radix-ui/react-*": "...",
    "lucide-react": "...",
    "tailwindcss": "...",
    // ... other UI libraries
  }
}
```

**backend/package.json** - Keep backend dependencies:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@pinecone-database/pinecone": "^6.1.2",
    "openai": "^5.12.2",
    "tsx": "^4.19.2",
    // ... other backend libraries
  }
}
```

### Phase 2: Move UI Components
```bash
# Move components
mv components/* ui/components/

# Move pages (excluding api)
mv app/* ui/pages/ 2>/dev/null || true
rm -rf ui/pages/api  # Remove if accidentally moved

# Move styles and assets
mv app/globals.css ui/styles/
mv app/dashboard/dashboard.css ui/styles/
mv app/images ui/assets/
mv app/favicon.ico ui/assets/
mv app/opengraph-image.png ui/assets/
mv app/twitter-image.png ui/assets/

# Move hooks and context
mv hooks/* ui/hooks/
mv app/context/* ui/context/

# Move config files
mv components.json ui/config/
mv assets.json ui/config/
```

### Phase 3: Move Backend Files
```bash
# Move API routes
mv app/api backend/

# Move services (organize from lib/)
mkdir -p backend/services/{risk-assessment,governance,ai/compliance,documentation}
# Move files accordingly...

# Move database
mv supabase backend/database/

# Move scripts and utils
mv scripts backend/
mv utils backend/

# Move types to backend
mv types/* backend/types/

# Move middleware
mv middleware.ts backend/middleware/index.ts
mv app/api/helper/auth.ts backend/middleware/

# Move config
mv vercel.json backend/config/
```

### Phase 4: Update Import Paths
After moving files, update all import statements to reflect the new structure:

```typescript
// Before
import { Button } from '@/components/ui/button'
import { riskAssessmentService } from '@/lib/risk-assessment'

// After
import { Button } from '@/ui/components/ui/button'
import { riskAssessmentService } from '@/backend/services/risk-assessment'
```

### Phase 5: Update Configuration Files
Update `next.config.ts`, `tailwind.config.ts`, and `tsconfig.json` to reflect new paths.

## Benefits of This Structure

1. **Clear Separation of Concerns**: UI and backend logic are completely separated
2. **Scalability**: Easy to add new features without mixing concerns
3. **Team Collaboration**: Frontend and backend teams can work independently
4. **Maintainability**: Easier to find and modify specific functionality
5. **Testing**: Clear boundaries for unit and integration testing
6. **Deployment**: Can deploy UI and backend as separate services if needed

## Configuration Updates Needed

### `tsconfig.json` - Update Path Mapping
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/ui/*": ["./ui/*"],
      "@/backend/*": ["./backend/*"]
    }
  }
}
```

### `next.config.ts` - Update Source Directories
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Update any hardcoded paths to reflect new structure
  experimental: {
    serverComponentsExternalPackages: ['@pinecone-database/pinecone']
  }
}

module.exports = nextConfig
```

## Next Steps

1. Create the folder structure as outlined
2. Move files according to the migration guide
3. Update import statements
4. Update configuration files
5. Test the application thoroughly
6. Update documentation and CI/CD pipelines

## AWS Deployment Considerations

### 🌐 **CORS Configuration**
Since UI and Backend will be separate AWS services, configure CORS in your backend:

**backend/middleware/cors.ts** (create this file):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function corsMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow your UI domain
  response.headers.set('Access-Control-Allow-Origin', process.env.UI_DOMAIN || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
```

### 🔗 **Environment Variables**
Set up separate environment variables for each service:

**UI Environment (.env.local)**:
```
NEXT_PUBLIC_API_URL=https://your-backend-api-url
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Backend Environment (.env.local)**:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
PINECONE_API_KEY=...
```

### 🚀 **Deployment Commands**
Each folder can now be deployed independently:

```bash
# Deploy UI
cd ui
npm run build
# Deploy to AWS Amplify/Netlify/Vercel

# Deploy Backend
cd backend
npm run build
# Deploy to AWS Lambda/API Gateway/EC2
```

## Next Steps

1. Create the folder structure as outlined
2. Move files according to the migration guide
3. Update import statements
4. Update configuration files
5. Test the application thoroughly
6. Update documentation and CI/CD pipelines

This reorganization will significantly improve your codebase maintainability and development workflow for separate AWS deployments! 🚀
