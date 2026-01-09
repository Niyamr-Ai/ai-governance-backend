import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { submitRiskAssessment, approveRiskAssessment, getRiskAssessmentById, updateRiskAssessment, deleteRiskAssessment, rejectRiskAssessment, updateMitigationStatus } from '../controllers/risk-assessments.controller';

const router = Router();

// GET /api/risk-assessments/:id
router.get('/:id', authenticateToken, getRiskAssessmentById);

// PUT /api/risk-assessments/:id
router.put('/:id', authenticateToken, updateRiskAssessment);

// DELETE /api/risk-assessments/:id
router.delete('/:id', authenticateToken, deleteRiskAssessment);

// POST /api/risk-assessments/:id/submit
router.post('/:id/submit', authenticateToken, submitRiskAssessment);

// POST /api/risk-assessments/:id/approve
router.post('/:id/approve', authenticateToken, approveRiskAssessment);

// POST /api/risk-assessments/:id/reject
router.post('/:id/reject', authenticateToken, rejectRiskAssessment);

// PUT /api/risk-assessments/:id/mitigation-status
router.put('/:id/mitigation-status', authenticateToken, updateMitigationStatus);

export default router;
