import { Request, Response, NextFunction } from "express";
/**
 * Extend Express Request to include authenticated user
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                sub: string;
                email?: string;
                role?: string;
                aud?: string;
                exp?: number;
                iat?: number;
            };
        }
    }
}
/**
 * Middleware: Authenticate Supabase JWT
 * - Expects Authorization: Bearer <access_token>
 * - Verifies token using SUPABASE_JWT_SECRET
 * - Attaches decoded token to req.user
 */
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Helper: Extract user ID from JWT token
 * - Expects Authorization: Bearer <access_token>
 * - Returns user ID (sub) or false if invalid
 */
export declare function getUserId(req: Request): string | false;
//# sourceMappingURL=auth.d.ts.map