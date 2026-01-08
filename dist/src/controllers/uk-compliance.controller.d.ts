import { Request, Response } from "express";
/**
 * GET /api/uk-compliance
 * Fetch all UK compliance assessments for the authenticated user
 */
export declare function getUkCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/uk-compliance
 * Create a new UK compliance assessment
 */
export declare function postUkCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/uk-compliance/[id]
 * Fetch a single UK compliance assessment by ID
 */
export declare function getUkComplianceById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=uk-compliance.controller.d.ts.map