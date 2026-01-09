import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAutomatedRiskAssessment, createAutomatedRiskAssessment, approveAutomatedRiskAssessment } from '../controllers/automated-risk-assessment.controller';

const router = Router();

// GET /api/ai-systems/:id/automated-risk-assessment
router.get('/:id/automated-risk-assessment', authenticateToken, getAutomatedRiskAssessment);

// POST /api/ai-systems/:id/automated-risk-assessment
router.post('/:id/automated-risk-assessment', authenticateToken, createAutomatedRiskAssessment);

// PATCH /api/ai-systems/:id/automated-risk-assessment/:assessmentId/approve
router.patch('/:id/automated-risk-assessment/:assessmentId/approve', authenticateToken, approveAutomatedRiskAssessment);

export default router;
