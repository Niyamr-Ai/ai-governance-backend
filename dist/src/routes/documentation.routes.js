"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const documentation_controller_1 = require("../controllers/documentation.controller");
const router = (0, express_1.Router)();
// GET /api/documentation
router.get('/', auth_1.authenticateToken, documentation_controller_1.getDocumentation);
exports.default = router;
//# sourceMappingURL=documentation.routes.js.map