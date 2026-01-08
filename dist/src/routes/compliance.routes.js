"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const compliance_controller_1 = require("../controllers/compliance.controller");
const router = (0, express_1.Router)();
// GET /api/compliance
router.get('/', requireAuth_1.requireAuth, compliance_controller_1.getCompliance);
// POST /api/compliance
router.post('/', requireAuth_1.requireAuth, compliance_controller_1.postCompliance);
// GET /api/compliance/:id
router.get('/:id', requireAuth_1.requireAuth, compliance_controller_1.getComplianceById);
// GET /api/compliance/detailed
router.get('/detailed', requireAuth_1.requireAuth, compliance_controller_1.getDetailedCompliance);
// POST /api/compliance/detailed
router.post('/detailed', requireAuth_1.requireAuth, compliance_controller_1.postDetailedCompliance);
exports.default = router;
//# sourceMappingURL=compliance.routes.js.map