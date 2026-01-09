"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const lifecycle_controller_1 = require("../controllers/lifecycle.controller");
const router = (0, express_1.Router)();
// GET /api/ai-systems/:id/lifecycle
router.get('/:id/lifecycle', auth_1.authenticateToken, lifecycle_controller_1.getLifecycle);
// PUT /api/ai-systems/:id/lifecycle
router.put('/:id/lifecycle', auth_1.authenticateToken, lifecycle_controller_1.updateLifecycle);
exports.default = router;
//# sourceMappingURL=lifecycle.routes.js.map