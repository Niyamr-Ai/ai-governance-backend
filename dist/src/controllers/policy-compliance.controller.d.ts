/**
 * Policy Compliance API Controller
 *
 * POST /api/policy-compliance/analyze - Analyze policy compliance
 * POST /api/policy-compliance/conflicts - Analyze policy conflicts
 * POST /api/policy-compliance/gaps - Analyze policy gaps
 */
import { Request, Response } from 'express';
/**
 * POST /api/policy-compliance/analyze - Analyze policy compliance
 */
export declare function analyzePolicyComplianceHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/policy-compliance/conflicts - Analyze policy conflicts
 */
export declare function analyzePolicyConflicts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/policy-compliance/gaps - Analyze policy compliance gaps
 */
export declare function analyzePolicyGaps(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=policy-compliance.controller.d.ts.map