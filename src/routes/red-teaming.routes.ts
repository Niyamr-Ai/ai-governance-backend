import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getRedTeaming, postRedTeaming, executeTargetedRedTeaming, generateTargetedRedTeaming } from '../controllers/red-teaming.controller';

const router = Router();

// GET /api/red-teaming
router.get('/', authenticateToken, getRedTeaming);

// POST /api/red-teaming
router.post('/', authenticateToken, postRedTeaming);

// POST /api/red-teaming/targeted
router.post('/targeted', authenticateToken, generateTargetedRedTeaming);

// POST /api/red-teaming/execute-targeted
router.post('/execute-targeted', authenticateToken, executeTargetedRedTeaming);

export default router;
