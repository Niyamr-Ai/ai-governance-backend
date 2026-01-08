/**
 * User API Controller
 *
 * GET /api/user/role - Get current user role
 */
import { Request, Response } from 'express';
/**
 * GET /api/user/role
 * Returns the current user's role (user or admin/compliance)
 */
export declare function getUserRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map