import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { processEvidence, upload } from '../controllers/evidence.controller';

const router = Router();

// POST /api/process-evidence
// Accepts multipart/form-data with files field
router.post('/process-evidence', authenticateToken, upload.array('files', 10), processEvidence);

export default router;

