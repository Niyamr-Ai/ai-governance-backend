import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listAISystems, getSystemTasks, postBlockerResolutions, getComplianceData, getDocumentation, postDocumentation, getOverallRisk, getSystemPolicies, postSystemPolicy, getSystemRiskAssessments, postSystemRiskAssessment, postRiskMitigations, getRiskTrends, postSmartRiskAssessment, postTransitionPlan, postTransitionReadiness, updateSystemPolicyMapping, deleteSystemPolicyMapping } from '../controllers/ai-systems.controller';
import { getLifecycle, updateLifecycle } from '../../api/ai-systems/[id]/lifecycle/route';

const router = Router();

// GET /api/ai-systems/list
router.get('/list', authenticateToken, listAISystems);

// GET /api/ai-systems/:id/tasks
router.get('/:id/tasks', authenticateToken, getSystemTasks);

// POST /api/ai-systems/:id/blocker-resolutions
router.post('/:id/blocker-resolutions', authenticateToken, postBlockerResolutions);

// GET /api/ai-systems/:id/compliance-data
router.get('/:id/compliance-data', authenticateToken, getComplianceData);

// GET /api/ai-systems/:id/documentation
router.get('/:id/documentation', authenticateToken, getDocumentation);

// POST /api/ai-systems/:id/documentation
router.post('/:id/documentation', authenticateToken, postDocumentation);

// GET /api/ai-systems/:id/overall-risk
router.get('/:id/overall-risk', authenticateToken, getOverallRisk);

// GET /api/ai-systems/:id/policies
router.get('/:id/policies', authenticateToken, getSystemPolicies);

// POST /api/ai-systems/:id/policies
router.post('/:id/policies', authenticateToken, postSystemPolicy);

// GET /api/ai-systems/:id/risk-assessments
router.get('/:id/risk-assessments', authenticateToken, getSystemRiskAssessments);

// POST /api/ai-systems/:id/risk-assessments
router.post('/:id/risk-assessments', authenticateToken, postSystemRiskAssessment);

// POST /api/ai-systems/:id/risk-mitigations
router.post('/:id/risk-mitigations', authenticateToken, postRiskMitigations);

// GET /api/ai-systems/:id/risk-trends
router.get('/:id/risk-trends', authenticateToken, getRiskTrends);

// POST /api/ai-systems/:id/smart-risk-assessment
router.post('/:id/smart-risk-assessment', authenticateToken, postSmartRiskAssessment);

// POST /api/ai-systems/:id/transition-plan
router.post('/:id/transition-plan', authenticateToken, postTransitionPlan);

// POST /api/ai-systems/:id/transition-readiness
router.post('/:id/transition-readiness', authenticateToken, postTransitionReadiness);

// PUT /api/ai-systems/:id/policies/:mappingId
router.put('/:id/policies/:mappingId', authenticateToken, updateSystemPolicyMapping);

// DELETE /api/ai-systems/:id/policies/:mappingId
router.delete('/:id/policies/:mappingId', authenticateToken, deleteSystemPolicyMapping);

// GET /api/ai-systems/:id/lifecycle
router.get('/:id/lifecycle', authenticateToken, getLifecycle);

// PUT /api/ai-systems/:id/lifecycle
router.put('/:id/lifecycle', authenticateToken, updateLifecycle);

export default router;