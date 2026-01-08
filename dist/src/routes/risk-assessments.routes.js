"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const risk_assessments_controller_1 = require("../controllers/risk-assessments.controller");
const router = (0, express_1.Router)();
// GET /api/risk-assessments/:id
router.get('/:id', risk_assessments_controller_1.getRiskAssessmentById);
// PUT /api/risk-assessments/:id
router.put('/:id', risk_assessments_controller_1.updateRiskAssessment);
// DELETE /api/risk-assessments/:id
router.delete('/:id', risk_assessments_controller_1.deleteRiskAssessment);
// POST /api/risk-assessments/:id/submit
router.post('/:id/submit', risk_assessments_controller_1.submitRiskAssessment);
// POST /api/risk-assessments/:id/approve
router.post('/:id/approve', risk_assessments_controller_1.approveRiskAssessment);
// POST /api/risk-assessments/:id/reject
router.post('/:id/reject', risk_assessments_controller_1.rejectRiskAssessment);
// PUT /api/risk-assessments/:id/mitigation-status
router.put('/:id/mitigation-status', risk_assessments_controller_1.updateMitigationStatus);
exports.default = router;
//# sourceMappingURL=risk-assessments.routes.js.map