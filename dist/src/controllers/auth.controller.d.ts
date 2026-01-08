/**
 * Auth Controller
 *
 * Handles authentication callback for Supabase auth flow
 */
import { Request, Response } from 'express';
/**
 * GET /api/auth/callback
 * Auth callback route for Supabase authentication flow
 */
export declare function authCallbackHandler(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map