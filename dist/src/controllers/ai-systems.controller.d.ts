/**
 * AI Systems API Controller
 *
 * GET /api/ai-systems/list - Get all AI systems from EU, UK, MAS, and Registry tables
 */
import { Request, Response } from 'express';
/**
 * GET /api/ai-systems/list
 * Get all AI systems from EU, UK, MAS, and Registry tables
 */
export declare function listAISystems(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/lookup-by-name?name=...
 * Lookup systemId by system name across all system tables
 * Searches in: eu_ai_act_check_results, uk_ai_assessments, mas_ai_risk_assessments, ai_system_registry
 */
export declare function lookupSystemByName(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/tasks
 * Get governance tasks for an AI system
 */
export declare function getSystemTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/blocker-resolutions
 * Generate blocker resolutions for AI system transition
 */
export declare function postBlockerResolutions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/documentation
 * Get all documentation for an AI system
 */
export declare function getDocumentation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/overall-risk
 * Get overall risk level for an AI system
 */
export declare function getOverallRisk(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/policies
 * Get all policies mapped to an AI system
 */
export declare function getSystemPolicies(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/policies
 * Map a policy to an AI system
 */
export declare function postSystemPolicy(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/risk-assessments
 * Get all risk assessments for an AI system
 */
export declare function getSystemRiskAssessments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/risk-assessments
 * Create a new risk assessment for an AI system
 */
export declare function postSystemRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/risk-mitigations
 * Generate risk mitigation suggestions for an AI system
 */
export declare function postRiskMitigations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/risk-trends
 * Analyze risk trends for an AI system over time
 */
export declare function getRiskTrends(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/smart-risk-assessment
 * Generate a contextual smart risk assessment for an AI system
 */
export declare function postSmartRiskAssessment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/transition-plan
 * Generate a transition plan for lifecycle stage changes
 */
export declare function postTransitionPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/transition-readiness
 * Assess readiness for lifecycle stage transition
 */
export declare function postTransitionReadiness(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/ai-systems/[id]/documentation
 * Generate new documentation for an AI system
 */
export declare function postDocumentation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/ai-systems/[id]/compliance-data
 * Get compliance data for an AI system from all compliance tables
 */
export declare function getComplianceData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/ai-systems/[id]/policies/[mappingId] - Update a policy mapping
 */
export declare function updateSystemPolicyMapping(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/ai-systems/[id]/policies/[mappingId] - Remove a policy mapping
 */
export declare function deleteSystemPolicyMapping(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=ai-systems.controller.d.ts.map