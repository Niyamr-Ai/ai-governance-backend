"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const governance_controller_1 = require("../controllers/governance.controller");
const router = (0, express_1.Router)();
// POST /api/governance-tasks/suggestions
router.post('/suggestions', auth_1.authenticateToken, governance_controller_1.getGovernanceSuggestions);
// POST /api/governance-tasks/completion-impact
router.post('/completion-impact', auth_1.authenticateToken, governance_controller_1.analyzeCompletionImpact);
// PATCH /api/governance-tasks/:taskId
router.patch('/:taskId', auth_1.authenticateToken, governance_controller_1.updateGovernanceTask);
// POST /api/governance-tasks/contextual-help
router.post('/contextual-help', auth_1.authenticateToken, governance_controller_1.getContextualHelp);
exports.default = router;
//# sourceMappingURL=governance.routes.js.map