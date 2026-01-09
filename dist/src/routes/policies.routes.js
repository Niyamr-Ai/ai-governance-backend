"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const policies_controller_1 = require("../controllers/policies.controller");
const router = (0, express_1.Router)();
// GET /api/policies
router.get('/', auth_1.authenticateToken, policies_controller_1.getPolicies);
// POST /api/policies
router.post('/', auth_1.authenticateToken, policies_controller_1.createPolicy);
// GET /api/policies/:id
router.get('/:id', auth_1.authenticateToken, policies_controller_1.getPolicyById);
// PUT /api/policies/:id
router.put('/:id', auth_1.authenticateToken, policies_controller_1.updatePolicy);
// DELETE /api/policies/:id
router.delete('/:id', auth_1.authenticateToken, policies_controller_1.deletePolicy);
// PUT /api/policies/:id/requirements/:requirementId
router.put('/:id/requirements/:requirementId', auth_1.authenticateToken, policies_controller_1.updatePolicyRequirement);
// GET /api/policies/:id/requirements
router.get('/:id/requirements', auth_1.authenticateToken, policies_controller_1.getPolicyRequirements);
// POST /api/policies/:id/requirements
router.post('/:id/requirements', auth_1.authenticateToken, policies_controller_1.createPolicyRequirement);
// DELETE /api/policies/:id/requirements/:requirementId
router.delete('/:id/requirements/:requirementId', auth_1.authenticateToken, policies_controller_1.deletePolicyRequirement);
exports.default = router;
//# sourceMappingURL=policies.routes.js.map