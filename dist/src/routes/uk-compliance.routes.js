"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const uk_compliance_controller_1 = require("../controllers/uk-compliance.controller");
const router = (0, express_1.Router)();
// GET /api/uk-compliance
router.get('/', requireAuth_1.requireAuth, uk_compliance_controller_1.getUkCompliance);
// POST /api/uk-compliance
router.post('/', requireAuth_1.requireAuth, uk_compliance_controller_1.postUkCompliance);
// GET /api/uk-compliance/:id
router.get('/:id', requireAuth_1.requireAuth, uk_compliance_controller_1.getUkComplianceById);
exports.default = router;
//# sourceMappingURL=uk-compliance.routes.js.map