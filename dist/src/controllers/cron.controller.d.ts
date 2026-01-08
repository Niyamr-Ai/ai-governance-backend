/**
 * Cron Jobs API Controller
 *
 * GET /api/cron/periodic-risk-review - Periodic risk review cron job
 * GET /api/cron/regenerate-documentation - Regenerate documentation cron job
 */
import { Request, Response } from 'express';
/**
 * GET /api/cron/periodic-risk-review - Periodic risk review cron job
 */
export declare function periodicRiskReview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET/POST /api/cron/regenerate-documentation - Regenerate outdated documentation
 */
export declare function regenerateDocumentation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cron.controller.d.ts.map