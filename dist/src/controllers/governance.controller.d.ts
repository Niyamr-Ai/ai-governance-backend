/**
 * Governance Tasks API Controller
 *
 * POST /api/governance-tasks/suggestions - Generate smart governance suggestions
 */
import { Request, Response } from 'express';
/**
 * POST /api/governance-tasks/suggestions
 * Generate smart governance suggestions
 */
export declare function getGovernanceSuggestions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/governance-tasks/completion-impact
 * Analyze the impact of completing a governance task
 */
export declare function analyzeCompletionImpact(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /api/governance-tasks/[taskId]
 * Update governance task status and evidence
 */
export declare function updateGovernanceTask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/governance-tasks/contextual-help
 * Get contextual help for governance tasks
 */
export declare function getContextualHelp(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=governance.controller.d.ts.map