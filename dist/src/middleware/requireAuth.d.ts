import { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware for Supabase JWT tokens
 * Verifies Authorization header and attaches userId to request
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=requireAuth.d.ts.map