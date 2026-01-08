/**
 * Risk Assessments API Controller
 *
 * POST /api/risk-assessments/[id]/submit - Submit risk assessment for review
 */
import { Request, Response } from 'express';
/**
 * POST /api/risk-assessments/[id]/submit - Submit risk assessment for review
 * Changes assessment status from 'draft' to 'submitted'
 * Only the creator can submit their own assessment
 */
export declare function submitRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/risk-assessments/[id]/approve
 * Approve risk assessment (changes status from 'submitted' to 'approved')
 * Only admins/compliance officers can approve
 * Approved assessments count toward overall risk level
 */
export declare function approveRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/risk-assessments/[id]/reject
 * Reject risk assessment (changes status from 'submitted' to 'rejected')
 * Only admins/compliance officers can reject
 * Rejected assessments do NOT count toward overall risk level
 */
export declare function rejectRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/risk-assessments/[id]/mitigation-status
 * Updates the mitigation status of a risk assessment
 * Mitigation status can be updated independently of workflow status
 */
export declare function updateMitigationStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/risk-assessments/[id] - Get a specific risk assessment
 */
export declare function getRiskAssessmentById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/risk-assessments/[id] - Update a risk assessment (Admin/Assessor only)
 */
export declare function updateRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/risk-assessments/[id] - Delete a risk assessment (Admin only)
 */
export declare function deleteRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=risk-assessments.controller.d.ts.map