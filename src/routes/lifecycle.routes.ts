import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getLifecycle, updateLifecycle } from '../controllers/lifecycle.controller';

const router = Router();

// GET /api/ai-systems/:id/lifecycle
router.get('/:id/lifecycle', authenticateToken, getLifecycle);

// PUT /api/ai-systems/:id/lifecycle
router.put('/:id/lifecycle', authenticateToken, updateLifecycle);

export default router;
