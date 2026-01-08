"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const regulatory_changes_controller_1 = require("../controllers/regulatory-changes.controller");
const router = (0, express_1.Router)();
// POST /api/regulatory-changes/action-plan
router.post('/action-plan', regulatory_changes_controller_1.generateActionPlan);
// POST /api/regulatory-changes/effort-estimation
router.post('/effort-estimation', regulatory_changes_controller_1.estimateEffort);
// POST /api/regulatory-changes/impact-analysis
router.post('/impact-analysis', regulatory_changes_controller_1.analyzeImpact);
exports.default = router;
//# sourceMappingURL=regulatory-changes.routes.js.map