import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { processEvidence, upload, analyzeGovernanceDocumentEndpoint, analyzeDocumentEndpoint } from '../controllers/evidence.controller';

const router = Router();

// POST /api/process-evidence
// Accepts multipart/form-data with files field
router.post('/process-evidence', authenticateToken, upload.array('files', 10), processEvidence);

// POST /api/analyze-governance-document
// Analyzes extracted text and returns structured data for form auto-population
// @deprecated Use /api/analyze-document instead
router.post('/analyze-governance-document', authenticateToken, analyzeGovernanceDocumentEndpoint);

// POST /api/analyze-document
// Universal endpoint for analyzing any evidence document
router.post('/analyze-document', authenticateToken, analyzeDocumentEndpoint);

export default router;

