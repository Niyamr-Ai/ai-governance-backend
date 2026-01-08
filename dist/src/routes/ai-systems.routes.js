"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_systems_controller_1 = require("../controllers/ai-systems.controller");
const router = (0, express_1.Router)();
// GET /api/ai-systems/list
router.get('/list', ai_systems_controller_1.listAISystems);
// GET /api/ai-systems/:id/tasks
router.get('/:id/tasks', ai_systems_controller_1.getSystemTasks);
// POST /api/ai-systems/:id/blocker-resolutions
router.post('/:id/blocker-resolutions', ai_systems_controller_1.postBlockerResolutions);
// GET /api/ai-systems/:id/compliance-data
router.get('/:id/compliance-data', ai_systems_controller_1.getComplianceData);
// GET /api/ai-systems/:id/documentation
router.get('/:id/documentation', ai_systems_controller_1.getDocumentation);
// POST /api/ai-systems/:id/documentation
router.post('/:id/documentation', ai_systems_controller_1.postDocumentation);
// GET /api/ai-systems/:id/overall-risk
router.get('/:id/overall-risk', ai_systems_controller_1.getOverallRisk);
// GET /api/ai-systems/:id/policies
router.get('/:id/policies', ai_systems_controller_1.getSystemPolicies);
// POST /api/ai-systems/:id/policies
router.post('/:id/policies', ai_systems_controller_1.postSystemPolicy);
// GET /api/ai-systems/:id/risk-assessments
router.get('/:id/risk-assessments', ai_systems_controller_1.getSystemRiskAssessments);
// POST /api/ai-systems/:id/risk-assessments
router.post('/:id/risk-assessments', ai_systems_controller_1.postSystemRiskAssessment);
// POST /api/ai-systems/:id/risk-mitigations
router.post('/:id/risk-mitigations', ai_systems_controller_1.postRiskMitigations);
// GET /api/ai-systems/:id/risk-trends
router.get('/:id/risk-trends', ai_systems_controller_1.getRiskTrends);
// POST /api/ai-systems/:id/smart-risk-assessment
router.post('/:id/smart-risk-assessment', ai_systems_controller_1.postSmartRiskAssessment);
// POST /api/ai-systems/:id/transition-plan
router.post('/:id/transition-plan', ai_systems_controller_1.postTransitionPlan);
// POST /api/ai-systems/:id/transition-readiness
router.post('/:id/transition-readiness', ai_systems_controller_1.postTransitionReadiness);
// PUT /api/ai-systems/:id/policies/:mappingId
router.put('/:id/policies/:mappingId', ai_systems_controller_1.updateSystemPolicyMapping);
// DELETE /api/ai-systems/:id/policies/:mappingId
router.delete('/:id/policies/:mappingId', ai_systems_controller_1.deleteSystemPolicyMapping);
exports.default = router;
//# sourceMappingURL=ai-systems.routes.js.map