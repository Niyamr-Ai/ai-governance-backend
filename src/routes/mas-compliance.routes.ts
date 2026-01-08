import { Router } from 'express';
import { getMasCompliance, postMasCompliance, getMasComplianceById } from '../controllers/mas-compliance.controller';

const router = Router();

// GET /api/mas-compliance
router.get('/', getMasCompliance);

// POST /api/mas-compliance
router.post('/', postMasCompliance);

// GET /api/mas-compliance/:id
router.get('/:id', getMasComplianceById);

export default router;
