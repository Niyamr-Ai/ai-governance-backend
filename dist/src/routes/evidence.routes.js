"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const evidence_controller_1 = require("../controllers/evidence.controller");
const router = (0, express_1.Router)();
// POST /api/process-evidence
// Accepts multipart/form-data with files field
router.post('/process-evidence', auth_1.authenticateToken, evidence_controller_1.upload.array('files', 10), evidence_controller_1.processEvidence);
exports.default = router;
//# sourceMappingURL=evidence.routes.js.map