import { Router } from 'express';
import { getDashboardInsightsHandler, getSystemInsightsHandler } from '../controllers/dashboard.controller';

const router = Router();

// POST /api/dashboard/insights
router.post('/insights', getDashboardInsightsHandler);

// POST /api/dashboard/system-insights
router.post('/system-insights', getSystemInsightsHandler);

export default router;