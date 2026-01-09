import { Router } from 'express';
import { authenticateToken } from "../middleware/auth";
import { getCompliance, postCompliance, getComplianceById, getDetailedCompliance, postDetailedCompliance } from '../controllers/compliance.controller';

const router = Router();

// GET /api/compliance
router.get('/', authenticateToken, getCompliance);

// POST /api/compliance
router.post('/', authenticateToken, postCompliance);

// GET /api/compliance/detailed
router.get('/detailed', authenticateToken, getDetailedCompliance);

// POST /api/compliance/detailed
router.post('/detailed', authenticateToken, postDetailedCompliance);

// GET /api/compliance/:id (must come last - most generic)
router.get('/:id', authenticateToken, getComplianceById);

export default router;
