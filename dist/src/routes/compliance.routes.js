"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const compliance_controller_1 = require("../controllers/compliance.controller");
const router = (0, express_1.Router)();
// GET /api/compliance
router.get('/', auth_1.authenticateToken, compliance_controller_1.getCompliance);
// POST /api/compliance
router.post('/', auth_1.authenticateToken, compliance_controller_1.postCompliance);
// GET /api/compliance/detailed
router.get('/detailed', auth_1.authenticateToken, compliance_controller_1.getDetailedCompliance);
// POST /api/compliance/detailed
router.post('/detailed', auth_1.authenticateToken, compliance_controller_1.postDetailedCompliance);
// GET /api/compliance/:id (must come last - most generic)
router.get('/:id', auth_1.authenticateToken, compliance_controller_1.getComplianceById);
exports.default = router;
//# sourceMappingURL=compliance.routes.js.map