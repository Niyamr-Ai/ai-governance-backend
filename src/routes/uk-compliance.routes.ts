import { Router } from 'express';
import { getUkCompliance, postUkCompliance, getUkComplianceById } from '../controllers/uk-compliance.controller';

const router = Router();

// GET /api/uk-compliance
router.get('/', getUkCompliance);

// POST /api/uk-compliance
router.post('/', postUkCompliance);

// GET /api/uk-compliance/:id
router.get('/:id', getUkComplianceById);

export default router;
