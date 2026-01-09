import { Router } from 'express';
import { authenticateToken } from "../middleware/auth";
import { getMasCompliance, postMasCompliance, getMasComplianceById } from '../controllers/mas-compliance.controller';

const router = Router();

// GET /api/mas-compliance
router.get('/', authenticateToken, getMasCompliance);

// POST /api/mas-compliance
router.post('/', authenticateToken, postMasCompliance);

// GET /api/mas-compliance/:id
router.get('/:id', authenticateToken, getMasComplianceById);

export default router;
