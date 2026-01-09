import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardInsightsHandler, getSystemInsightsHandler } from '../controllers/dashboard.controller';

const router = Router();

// POST /api/dashboard/insights
router.post('/insights', authenticateToken, getDashboardInsightsHandler);

// POST /api/dashboard/system-insights
router.post('/system-insights', authenticateToken, getSystemInsightsHandler);

export default router;