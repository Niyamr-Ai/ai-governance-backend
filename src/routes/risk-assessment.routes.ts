import { Router } from 'express';
import { getFieldGuidanceHandler, getGuidanceHandler } from '../controllers/risk-assessment.controller';

const router = Router();

// POST /api/risk-assessment/field-guidance
router.post('/field-guidance', getFieldGuidanceHandler);

// POST /api/risk-assessment/guidance
router.post('/guidance', getGuidanceHandler);

export default router;
