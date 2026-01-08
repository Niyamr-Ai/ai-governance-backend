import { Router } from 'express';
import { periodicRiskReview, regenerateDocumentation } from '../controllers/cron.controller';

const router = Router();

// GET /api/cron/periodic-risk-review
router.get('/periodic-risk-review', periodicRiskReview);

// GET /api/cron/regenerate-documentation
router.get('/regenerate-documentation', regenerateDocumentation);

// POST /api/cron/regenerate-documentation (alternative method)
router.post('/regenerate-documentation', regenerateDocumentation);

export default router;
