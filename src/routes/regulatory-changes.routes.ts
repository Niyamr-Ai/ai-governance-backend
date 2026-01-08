import { Router } from 'express';
import { generateActionPlan, estimateEffort, analyzeImpact } from '../controllers/regulatory-changes.controller';

const router = Router();

// POST /api/regulatory-changes/action-plan
router.post('/action-plan', generateActionPlan);

// POST /api/regulatory-changes/effort-estimation
router.post('/effort-estimation', estimateEffort);

// POST /api/regulatory-changes/impact-analysis
router.post('/impact-analysis', analyzeImpact);

export default router;
