/**
 * Policies API Controller
 * Handles CRUD operations for policies (both external and internal)
 */
import { Request, Response } from 'express';
/**
 * GET /api/policies - List all policies
 */
export declare function getPolicies(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/policies - Create a new internal policy
 */
export declare function createPolicy(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/policies/[id] - Get a specific policy with requirements
 */
export declare function getPolicyById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/policies/[id] - Update a specific policy
 */
export declare function updatePolicy(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/policies/[id] - Delete a specific policy
 */
export declare function deletePolicy(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/policies/[id]/requirements/[requirementId] - Update a requirement
 */
export declare function updatePolicyRequirement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/policies/[id]/requirements/[requirementId] - Delete a requirement
 */
export declare function deletePolicyRequirement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/policies/[id]/requirements - Get all requirements for a policy
 */
export declare function getPolicyRequirements(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/policies/[id]/requirements - Create a new requirement
 */
export declare function createPolicyRequirement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=policies.controller.d.ts.map