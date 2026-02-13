"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const documentation_controller_1 = require("../controllers/documentation.controller");
const router = (0, express_1.Router)();
// GET /api/documentation
router.get('/', auth_1.authenticateToken, documentation_controller_1.getDocumentation);
// GET /api/documentation/:id/pdf
router.get('/:id/pdf', auth_1.authenticateToken, documentation_controller_1.getDocumentationPDF);
exports.default = router;
//# sourceMappingURL=documentation.routes.js.map