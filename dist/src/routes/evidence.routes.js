"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const evidence_controller_1 = require("../controllers/evidence.controller");
const router = (0, express_1.Router)();
// POST /api/process-evidence
// Accepts multipart/form-data with files field
router.post('/process-evidence', auth_1.authenticateToken, evidence_controller_1.upload.array('files', 10), evidence_controller_1.processEvidence);
// POST /api/analyze-governance-document
// Analyzes extracted text and returns structured data for form auto-population
// @deprecated Use /api/analyze-document instead
router.post('/analyze-governance-document', auth_1.authenticateToken, evidence_controller_1.analyzeGovernanceDocumentEndpoint);
// POST /api/analyze-document
// Universal endpoint for analyzing any evidence document
router.post('/analyze-document', auth_1.authenticateToken, evidence_controller_1.analyzeDocumentEndpoint);
exports.default = router;
//# sourceMappingURL=evidence.routes.js.map