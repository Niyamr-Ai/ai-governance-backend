# AI Governance Backend

Express.js backend for AI Governance Platform with Supabase authentication.

## Environment Variables

The backend requires the following environment variables to be set:

### Required Supabase Configuration
```bash
# Frontend Supabase Configuration (also needed for backend JWT verification)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend JWT Verification (CRITICAL for authentication)
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### Backend Configuration
```bash
NODE_ENV=development
PORT=3001
```

## Getting Supabase JWT Secret

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the "JWT Secret" (NOT the anon key)

⚠️ **Important**: The `SUPABASE_JWT_SECRET` is different from `NEXT_PUBLIC_SUPABASE_ANON_KEY`. You need the JWT Secret for backend token verification.

## Running the Backend

```bash
cd ai-governance-backend
npm install
npm run dev
```

## API Authentication

All protected routes require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

The token is automatically obtained by the frontend using `supabase.auth.getSession()` and sent via the `backendFetch` helper.

## Troubleshooting Authentication

### 401 "Authentication required"
- Check that `SUPABASE_JWT_SECRET` is set in backend environment
- Verify the JWT secret matches your Supabase project
- Ensure frontend is sending the Authorization header

### 401 "Invalid token"
- JWT token may be expired - refresh the session
- JWT secret may be incorrect
- Frontend and backend may be using different Supabase projects

## CORS Configuration

The backend allows the `Authorization` header from any origin in development. In production, configure the CORS origin to match your frontend domain.
