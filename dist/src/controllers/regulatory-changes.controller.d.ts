/**
 * Regulatory Changes API Controller
 *
 * POST /api/regulatory-changes/action-plan - Generate compliance action plan
 * POST /api/regulatory-changes/effort-estimation - Estimate implementation effort
 * POST /api/regulatory-changes/impact-analysis - Analyze regulatory change impact
 */
import { Request, Response } from 'express';
/**
 * POST /api/regulatory-changes/action-plan - Generate compliance action plan
 */
export declare function generateActionPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/regulatory-changes/effort-estimation - Estimate implementation effort
 */
export declare function estimateEffort(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/regulatory-changes/impact-analysis - Analyze regulatory change impact
 */
export declare function analyzeImpact(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=regulatory-changes.controller.d.ts.map