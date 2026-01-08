/**
 * Red Teaming API Controller
 *
 * GET /api/red-teaming - List all red teaming test results
 * POST /api/red-teaming - Run red teaming tests
 */
import { Request, Response } from 'express';
/**
 * GET /api/red-teaming - List all red teaming test results
 */
export declare function getRedTeaming(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/red-teaming - Run red teaming tests
 */
export declare function postRedTeaming(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/red-teaming/execute-targeted - Execute targeted red teaming tests
 */
export declare function executeTargetedRedTeaming(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/red-teaming/targeted - Generate targeted red teaming tests
 */
export declare function generateTargetedRedTeaming(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=red-teaming.controller.d.ts.map