"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const automated_risk_assessment_controller_1 = require("../controllers/automated-risk-assessment.controller");
const router = (0, express_1.Router)();
// GET /api/ai-systems/:id/automated-risk-assessment
router.get('/:id/automated-risk-assessment', automated_risk_assessment_controller_1.getAutomatedRiskAssessment);
// POST /api/ai-systems/:id/automated-risk-assessment
router.post('/:id/automated-risk-assessment', automated_risk_assessment_controller_1.createAutomatedRiskAssessment);
// PATCH /api/ai-systems/:id/automated-risk-assessment/:assessmentId/approve
router.patch('/:id/automated-risk-assessment/:assessmentId/approve', automated_risk_assessment_controller_1.approveAutomatedRiskAssessment);
exports.default = router;
//# sourceMappingURL=automated-risk-assessment.routes.js.map