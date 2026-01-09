"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const uk_compliance_controller_1 = require("../controllers/uk-compliance.controller");
const router = (0, express_1.Router)();
// GET /api/uk-compliance
router.get('/', auth_1.authenticateToken, uk_compliance_controller_1.getUkCompliance);
// POST /api/uk-compliance
router.post('/', auth_1.authenticateToken, uk_compliance_controller_1.postUkCompliance);
// GET /api/uk-compliance/:id
router.get('/:id', auth_1.authenticateToken, uk_compliance_controller_1.getUkComplianceById);
exports.default = router;
//# sourceMappingURL=uk-compliance.routes.js.map