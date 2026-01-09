"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const red_teaming_controller_1 = require("../controllers/red-teaming.controller");
const router = (0, express_1.Router)();
// GET /api/red-teaming
router.get('/', auth_1.authenticateToken, red_teaming_controller_1.getRedTeaming);
// POST /api/red-teaming
router.post('/', auth_1.authenticateToken, red_teaming_controller_1.postRedTeaming);
// POST /api/red-teaming/targeted
router.post('/targeted', auth_1.authenticateToken, red_teaming_controller_1.generateTargetedRedTeaming);
// POST /api/red-teaming/execute-targeted
router.post('/execute-targeted', auth_1.authenticateToken, red_teaming_controller_1.executeTargetedRedTeaming);
exports.default = router;
//# sourceMappingURL=red-teaming.routes.js.map