"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policies_controller_1 = require("../controllers/policies.controller");
const router = (0, express_1.Router)();
// GET /api/policies
router.get('/', policies_controller_1.getPolicies);
// POST /api/policies
router.post('/', policies_controller_1.createPolicy);
// GET /api/policies/:id
router.get('/:id', policies_controller_1.getPolicyById);
// PUT /api/policies/:id
router.put('/:id', policies_controller_1.updatePolicy);
// DELETE /api/policies/:id
router.delete('/:id', policies_controller_1.deletePolicy);
// PUT /api/policies/:id/requirements/:requirementId
router.put('/:id/requirements/:requirementId', policies_controller_1.updatePolicyRequirement);
// GET /api/policies/:id/requirements
router.get('/:id/requirements', policies_controller_1.getPolicyRequirements);
// POST /api/policies/:id/requirements
router.post('/:id/requirements', policies_controller_1.createPolicyRequirement);
// DELETE /api/policies/:id/requirements/:requirementId
router.delete('/:id/requirements/:requirementId', policies_controller_1.deletePolicyRequirement);
exports.default = router;
//# sourceMappingURL=policies.routes.js.map