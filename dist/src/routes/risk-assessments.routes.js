"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const risk_assessments_controller_1 = require("../controllers/risk-assessments.controller");
const router = (0, express_1.Router)();
// GET /api/risk-assessments/:id
router.get('/:id', auth_1.authenticateToken, risk_assessments_controller_1.getRiskAssessmentById);
// PUT /api/risk-assessments/:id
router.put('/:id', auth_1.authenticateToken, risk_assessments_controller_1.updateRiskAssessment);
// DELETE /api/risk-assessments/:id
router.delete('/:id', auth_1.authenticateToken, risk_assessments_controller_1.deleteRiskAssessment);
// POST /api/risk-assessments/:id/submit
router.post('/:id/submit', auth_1.authenticateToken, risk_assessments_controller_1.submitRiskAssessment);
// POST /api/risk-assessments/:id/approve
router.post('/:id/approve', auth_1.authenticateToken, risk_assessments_controller_1.approveRiskAssessment);
// POST /api/risk-assessments/:id/reject
router.post('/:id/reject', auth_1.authenticateToken, risk_assessments_controller_1.rejectRiskAssessment);
// PUT /api/risk-assessments/:id/mitigation-status
router.put('/:id/mitigation-status', auth_1.authenticateToken, risk_assessments_controller_1.updateMitigationStatus);
exports.default = router;
//# sourceMappingURL=risk-assessments.routes.js.map