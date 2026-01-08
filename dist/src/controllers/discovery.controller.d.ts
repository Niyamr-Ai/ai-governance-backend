/**
 * Discovery API Controller
 *
 * POST /api/discovery/smart-assessment - Generate smart assessment for discovered AI assets
 */
import { Request, Response } from 'express';
/**
 * POST /api/discovery/smart-assessment - Generate smart assessment for discovered AI assets
 */
export declare function createSmartAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/discovery - List all discovered AI assets
 */
export declare function getDiscovery(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery - Create a new discovered asset
 */
export declare function postDiscovery(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/link-suggestions
 * Generate system linking suggestions for discovered assets
 */
export declare function getLinkSuggestions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/[id]/mark-shadow
 * Mark a discovered asset as confirmed Shadow AI
 */
export declare function markAsShadowAI(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/[id]/resolve
 * Mark a discovered asset as resolved (false positive or no longer relevant)
 */
export declare function resolveDiscoveredAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/[id]/create-system
 * Create a new AI system from a discovered asset
 * Then links the asset to the newly created system
 */
export declare function createSystemFromAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/prioritization
 * Prioritize discovered AI systems based on risk and business impact
 */
export declare function getPrioritization(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/discovery/[id]/link
 * Link a discovered asset to an existing AI system
 */
export declare function linkDiscoveredAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=discovery.controller.d.ts.map