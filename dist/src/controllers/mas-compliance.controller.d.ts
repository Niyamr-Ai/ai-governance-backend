import { Request, Response } from "express";
/**
 * GET /api/mas-compliance
 */
export declare function getMasCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/mas-compliance
 */
export declare function postMasCompliance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/mas-compliance/:id
 * Fetch a single MAS compliance assessment by ID
 */
export declare function getMasComplianceById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=mas-compliance.controller.d.ts.map