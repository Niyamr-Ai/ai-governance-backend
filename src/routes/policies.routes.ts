import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPolicies, createPolicy, getPolicyById, updatePolicy, deletePolicy, updatePolicyRequirement, deletePolicyRequirement, getPolicyRequirements, createPolicyRequirement } from '../controllers/policies.controller';

const router = Router();

// GET /api/policies
router.get('/', authenticateToken, getPolicies);

// POST /api/policies
router.post('/', authenticateToken, createPolicy);

// GET /api/policies/:id
router.get('/:id', authenticateToken, getPolicyById);

// PUT /api/policies/:id
router.put('/:id', authenticateToken, updatePolicy);

// DELETE /api/policies/:id
router.delete('/:id', authenticateToken, deletePolicy);

// PUT /api/policies/:id/requirements/:requirementId
router.put('/:id/requirements/:requirementId', authenticateToken, updatePolicyRequirement);

// GET /api/policies/:id/requirements
router.get('/:id/requirements', authenticateToken, getPolicyRequirements);

// POST /api/policies/:id/requirements
router.post('/:id/requirements', authenticateToken, createPolicyRequirement);

// DELETE /api/policies/:id/requirements/:requirementId
router.delete('/:id/requirements/:requirementId', authenticateToken, deletePolicyRequirement);

export default router;
