"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ai_systems_controller_1 = require("../controllers/ai-systems.controller");
const router = (0, express_1.Router)();
// GET /api/ai-systems/list
router.get('/list', auth_1.authenticateToken, ai_systems_controller_1.listAISystems);
// GET /api/ai-systems/:id/tasks
router.get('/:id/tasks', auth_1.authenticateToken, ai_systems_controller_1.getSystemTasks);
// POST /api/ai-systems/:id/blocker-resolutions
router.post('/:id/blocker-resolutions', auth_1.authenticateToken, ai_systems_controller_1.postBlockerResolutions);
// GET /api/ai-systems/:id/compliance-data
router.get('/:id/compliance-data', auth_1.authenticateToken, ai_systems_controller_1.getComplianceData);
// GET /api/ai-systems/:id/documentation
router.get('/:id/documentation', auth_1.authenticateToken, ai_systems_controller_1.getDocumentation);
// POST /api/ai-systems/:id/documentation
router.post('/:id/documentation', auth_1.authenticateToken, ai_systems_controller_1.postDocumentation);
// GET /api/ai-systems/:id/overall-risk
router.get('/:id/overall-risk', auth_1.authenticateToken, ai_systems_controller_1.getOverallRisk);
// GET /api/ai-systems/:id/policies
router.get('/:id/policies', auth_1.authenticateToken, ai_systems_controller_1.getSystemPolicies);
// POST /api/ai-systems/:id/policies
router.post('/:id/policies', auth_1.authenticateToken, ai_systems_controller_1.postSystemPolicy);
// GET /api/ai-systems/:id/risk-assessments
router.get('/:id/risk-assessments', auth_1.authenticateToken, ai_systems_controller_1.getSystemRiskAssessments);
// POST /api/ai-systems/:id/risk-assessments
router.post('/:id/risk-assessments', auth_1.authenticateToken, ai_systems_controller_1.postSystemRiskAssessment);
// POST /api/ai-systems/:id/risk-mitigations
router.post('/:id/risk-mitigations', auth_1.authenticateToken, ai_systems_controller_1.postRiskMitigations);
// GET /api/ai-systems/:id/risk-trends
router.get('/:id/risk-trends', auth_1.authenticateToken, ai_systems_controller_1.getRiskTrends);
// POST /api/ai-systems/:id/smart-risk-assessment
router.post('/:id/smart-risk-assessment', auth_1.authenticateToken, ai_systems_controller_1.postSmartRiskAssessment);
// POST /api/ai-systems/:id/transition-plan
router.post('/:id/transition-plan', auth_1.authenticateToken, ai_systems_controller_1.postTransitionPlan);
// POST /api/ai-systems/:id/transition-readiness
router.post('/:id/transition-readiness', auth_1.authenticateToken, ai_systems_controller_1.postTransitionReadiness);
// PUT /api/ai-systems/:id/policies/:mappingId
router.put('/:id/policies/:mappingId', auth_1.authenticateToken, ai_systems_controller_1.updateSystemPolicyMapping);
// DELETE /api/ai-systems/:id/policies/:mappingId
router.delete('/:id/policies/:mappingId', auth_1.authenticateToken, ai_systems_controller_1.deleteSystemPolicyMapping);
exports.default = router;
//# sourceMappingURL=ai-systems.routes.js.map