/**
 * Lifecycle Governance API Controller
 *
 * GET /api/ai-systems/[id]/lifecycle - Get lifecycle stage and history
 * PUT /api/ai-systems/[id]/lifecycle - Update lifecycle stage
 */
import { Request, Response } from 'express';
/**
 * GET /api/ai-systems/[id]/lifecycle - Retrieve lifecycle stage and history for an AI system
 */
export declare function getLifecycle(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/ai-systems/[id]/lifecycle - Update lifecycle stage for an AI system
 */
export declare function updateLifecycle(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=lifecycle.controller.d.ts.map