"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const risk_assessment_controller_1 = require("../controllers/risk-assessment.controller");
const router = (0, express_1.Router)();
// POST /api/risk-assessment/field-guidance
router.post('/field-guidance', risk_assessment_controller_1.getFieldGuidanceHandler);
// POST /api/risk-assessment/guidance
router.post('/guidance', risk_assessment_controller_1.getGuidanceHandler);
exports.default = router;
//# sourceMappingURL=risk-assessment.routes.js.map