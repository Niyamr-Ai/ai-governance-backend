import { Request, Response } from "express";
import multer from "multer";
export declare const upload: multer.Multer;
export declare function processEvidence(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/analyze-governance-document
 * Analyzes extracted text from a governance document and returns structured data
 * for auto-populating form fields
 * @deprecated Use /api/analyze-document instead
 */
export declare function analyzeGovernanceDocumentEndpoint(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/analyze-document
 * Universal endpoint for analyzing any evidence document and returning structured data
 * for auto-populating form fields
 */
export declare function analyzeDocumentEndpoint(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=evidence.controller.d.ts.map