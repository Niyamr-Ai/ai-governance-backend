import { Router } from 'express';
import { getRedTeaming, postRedTeaming, executeTargetedRedTeaming, generateTargetedRedTeaming } from '../controllers/red-teaming.controller';

const router = Router();

// GET /api/red-teaming
router.get('/', getRedTeaming);

// POST /api/red-teaming
router.post('/', postRedTeaming);

// POST /api/red-teaming/targeted
router.post('/targeted', generateTargetedRedTeaming);

// POST /api/red-teaming/execute-targeted
router.post('/execute-targeted', executeTargetedRedTeaming);

export default router;
