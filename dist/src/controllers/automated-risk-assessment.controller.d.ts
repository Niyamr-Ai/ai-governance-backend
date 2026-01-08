/**
 * Automated Risk Assessment API Controller
 *
 * GET /api/ai-systems/[id]/automated-risk-assessment - Fetch existing automated risk assessment
 * POST /api/ai-systems/[id]/automated-risk-assessment - Generate new automated risk assessment
 */
import { Request, Response } from 'express';
/**
 * GET /api/ai-systems/[id]/automated-risk-assessment - Fetch existing automated risk assessment
 */
export declare function getAutomatedRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/automated-risk-assessment - Generate new automated risk assessment
 */
export declare function createAutomatedRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /api/ai-systems/[id]/automated-risk-assessment/[assessmentId]/approve
 * Approve, reject, or request revision for an automated risk assessment
 */
export declare function approveAutomatedRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=automated-risk-assessment.controller.d.ts.map