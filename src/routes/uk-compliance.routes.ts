import { Router } from 'express';
import { authenticateToken } from "../middleware/auth";
import { getUkCompliance, postUkCompliance, getUkComplianceById } from '../controllers/uk-compliance.controller';

const router = Router();

// GET /api/uk-compliance
router.get('/', authenticateToken, getUkCompliance);

// POST /api/uk-compliance
router.post('/', authenticateToken, postUkCompliance);

// GET /api/uk-compliance/:id
router.get('/:id', authenticateToken, getUkComplianceById);

export default router;
