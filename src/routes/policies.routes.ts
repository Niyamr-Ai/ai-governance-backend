import { Router } from 'express';
import { getPolicies, createPolicy, getPolicyById, updatePolicy, deletePolicy, updatePolicyRequirement, deletePolicyRequirement, getPolicyRequirements, createPolicyRequirement } from '../controllers/policies.controller';

const router = Router();

// GET /api/policies
router.get('/', getPolicies);

// POST /api/policies
router.post('/', createPolicy);

// GET /api/policies/:id
router.get('/:id', getPolicyById);

// PUT /api/policies/:id
router.put('/:id', updatePolicy);

// DELETE /api/policies/:id
router.delete('/:id', deletePolicy);

// PUT /api/policies/:id/requirements/:requirementId
router.put('/:id/requirements/:requirementId', updatePolicyRequirement);

// GET /api/policies/:id/requirements
router.get('/:id/requirements', getPolicyRequirements);

// POST /api/policies/:id/requirements
router.post('/:id/requirements', createPolicyRequirement);

// DELETE /api/policies/:id/requirements/:requirementId
router.delete('/:id/requirements/:requirementId', deletePolicyRequirement);

export default router;
