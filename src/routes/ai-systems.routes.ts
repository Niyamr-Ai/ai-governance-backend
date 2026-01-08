import { Router } from 'express';
import { listAISystems, getSystemTasks, postBlockerResolutions, getComplianceData, getDocumentation, postDocumentation, getOverallRisk, getSystemPolicies, postSystemPolicy, getSystemRiskAssessments, postSystemRiskAssessment, postRiskMitigations, getRiskTrends, postSmartRiskAssessment, postTransitionPlan, postTransitionReadiness, updateSystemPolicyMapping, deleteSystemPolicyMapping } from '../controllers/ai-systems.controller';

const router = Router();

// GET /api/ai-systems/list
router.get('/list', listAISystems);

// GET /api/ai-systems/:id/tasks
router.get('/:id/tasks', getSystemTasks);

// POST /api/ai-systems/:id/blocker-resolutions
router.post('/:id/blocker-resolutions', postBlockerResolutions);

// GET /api/ai-systems/:id/compliance-data
router.get('/:id/compliance-data', getComplianceData);

// GET /api/ai-systems/:id/documentation
router.get('/:id/documentation', getDocumentation);

// POST /api/ai-systems/:id/documentation
router.post('/:id/documentation', postDocumentation);

// GET /api/ai-systems/:id/overall-risk
router.get('/:id/overall-risk', getOverallRisk);

// GET /api/ai-systems/:id/policies
router.get('/:id/policies', getSystemPolicies);

// POST /api/ai-systems/:id/policies
router.post('/:id/policies', postSystemPolicy);

// GET /api/ai-systems/:id/risk-assessments
router.get('/:id/risk-assessments', getSystemRiskAssessments);

// POST /api/ai-systems/:id/risk-assessments
router.post('/:id/risk-assessments', postSystemRiskAssessment);

// POST /api/ai-systems/:id/risk-mitigations
router.post('/:id/risk-mitigations', postRiskMitigations);

// GET /api/ai-systems/:id/risk-trends
router.get('/:id/risk-trends', getRiskTrends);

// POST /api/ai-systems/:id/smart-risk-assessment
router.post('/:id/smart-risk-assessment', postSmartRiskAssessment);

// POST /api/ai-systems/:id/transition-plan
router.post('/:id/transition-plan', postTransitionPlan);

// POST /api/ai-systems/:id/transition-readiness
router.post('/:id/transition-readiness', postTransitionReadiness);

// PUT /api/ai-systems/:id/policies/:mappingId
router.put('/:id/policies/:mappingId', updateSystemPolicyMapping);

// DELETE /api/ai-systems/:id/policies/:mappingId
router.delete('/:id/policies/:mappingId', deleteSystemPolicyMapping);

export default router;