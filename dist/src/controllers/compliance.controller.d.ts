import { Request, Response } from "express";
/**
 * GET /api/compliance
 * Fetch all basic compliance checks for the authenticated user
 */
export declare function getCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/compliance
 * Process EU AI Act compliance assessment
 */
export declare function postCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/compliance/[id]
 * Fetch a single compliance result by ID
 */
export declare function getComplianceById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/compliance/detailed
 * Fetch detailed compliance assessment by ID
 */
export declare function getDetailedCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/compliance/detailed
 * Perform detailed EU AI Act compliance assessment
 */
export declare function postDetailedCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=compliance.controller.d.ts.map