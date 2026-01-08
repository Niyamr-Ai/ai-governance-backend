"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policy_compliance_controller_1 = require("../controllers/policy-compliance.controller");
const router = (0, express_1.Router)();
// POST /api/policy-compliance/analyze
router.post('/analyze', policy_compliance_controller_1.analyzePolicyComplianceHandler);
// POST /api/policy-compliance/conflicts
router.post('/conflicts', policy_compliance_controller_1.analyzePolicyConflicts);
// POST /api/policy-compliance/gaps
router.post('/gaps', policy_compliance_controller_1.analyzePolicyGaps);
exports.default = router;
//# sourceMappingURL=policy-compliance.routes.js.map