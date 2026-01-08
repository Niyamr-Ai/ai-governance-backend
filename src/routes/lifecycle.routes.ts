import { Router } from 'express';
import { getLifecycle, updateLifecycle } from '../controllers/lifecycle.controller';

const router = Router();

// GET /api/ai-systems/:id/lifecycle
router.get('/:id/lifecycle', getLifecycle);

// PUT /api/ai-systems/:id/lifecycle
router.put('/:id/lifecycle', updateLifecycle);

export default router;
