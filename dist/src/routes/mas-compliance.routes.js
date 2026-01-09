"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mas_compliance_controller_1 = require("../controllers/mas-compliance.controller");
const router = (0, express_1.Router)();
// GET /api/mas-compliance
router.get('/', auth_1.authenticateToken, mas_compliance_controller_1.getMasCompliance);
// POST /api/mas-compliance
router.post('/', auth_1.authenticateToken, mas_compliance_controller_1.postMasCompliance);
// GET /api/mas-compliance/:id
router.get('/:id', auth_1.authenticateToken, mas_compliance_controller_1.getMasComplianceById);
exports.default = router;
//# sourceMappingURL=mas-compliance.routes.js.map