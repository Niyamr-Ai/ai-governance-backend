"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const governance_controller_1 = require("../controllers/governance.controller");
const router = (0, express_1.Router)();
// POST /api/governance-tasks/suggestions
router.post('/suggestions', governance_controller_1.getGovernanceSuggestions);
// POST /api/governance-tasks/completion-impact
router.post('/completion-impact', governance_controller_1.analyzeCompletionImpact);
// PATCH /api/governance-tasks/:taskId
router.patch('/:taskId', governance_controller_1.updateGovernanceTask);
// POST /api/governance-tasks/contextual-help
router.post('/contextual-help', governance_controller_1.getContextualHelp);
exports.default = router;
//# sourceMappingURL=governance.routes.js.map