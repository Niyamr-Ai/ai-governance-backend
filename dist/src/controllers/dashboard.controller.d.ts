/**
 * Dashboard API Controller
 *
 * POST /api/dashboard/insights - Provides RAG-powered insights for compliance dashboards
 */
import { Request, Response } from 'express';
/**
 * POST /api/dashboard/insights
 * Provides RAG-powered insights for compliance dashboards
 */
export declare function getDashboardInsightsHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/dashboard/system-insights
 * Provides RAG-powered insights for individual systems
 */
export declare function getSystemInsightsHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=dashboard.controller.d.ts.map