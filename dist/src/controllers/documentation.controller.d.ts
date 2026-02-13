/**
 * Global Documentation API Controller
 *
 * GET /api/documentation - Returns all documentation across all AI systems with system information
 * GET /api/documentation/:id/pdf - Downloads documentation as PDF
 */
import { Request, Response } from 'express';
/**
 * GET /api/documentation
 * Returns all documentation across all AI systems with system information
 */
export declare function getDocumentation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/documentation/:id/pdf
 * Downloads a specific documentation as PDF
 */
export declare function getDocumentationPDF(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=documentation.controller.d.ts.map