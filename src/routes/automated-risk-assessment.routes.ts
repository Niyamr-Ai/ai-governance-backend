import { Router } from 'express';
import { getAutomatedRiskAssessment, createAutomatedRiskAssessment, approveAutomatedRiskAssessment } from '../controllers/automated-risk-assessment.controller';

const router = Router();

// GET /api/ai-systems/:id/automated-risk-assessment
router.get('/:id/automated-risk-assessment', getAutomatedRiskAssessment);

// POST /api/ai-systems/:id/automated-risk-assessment
router.post('/:id/automated-risk-assessment', createAutomatedRiskAssessment);

// PATCH /api/ai-systems/:id/automated-risk-assessment/:assessmentId/approve
router.patch('/:id/automated-risk-assessment/:assessmentId/approve', approveAutomatedRiskAssessment);

export default router;
