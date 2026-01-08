import { Router } from 'express';
import { submitRiskAssessment, approveRiskAssessment, getRiskAssessmentById, updateRiskAssessment, deleteRiskAssessment, rejectRiskAssessment, updateMitigationStatus } from '../controllers/risk-assessments.controller';

const router = Router();

// GET /api/risk-assessments/:id
router.get('/:id', getRiskAssessmentById);

// PUT /api/risk-assessments/:id
router.put('/:id', updateRiskAssessment);

// DELETE /api/risk-assessments/:id
router.delete('/:id', deleteRiskAssessment);

// POST /api/risk-assessments/:id/submit
router.post('/:id/submit', submitRiskAssessment);

// POST /api/risk-assessments/:id/approve
router.post('/:id/approve', approveRiskAssessment);

// POST /api/risk-assessments/:id/reject
router.post('/:id/reject', rejectRiskAssessment);

// PUT /api/risk-assessments/:id/mitigation-status
router.put('/:id/mitigation-status', updateMitigationStatus);

export default router;
