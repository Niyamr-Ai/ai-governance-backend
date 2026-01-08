import { Router } from 'express';
import { getCompliance, postCompliance, getComplianceById, getDetailedCompliance, postDetailedCompliance } from '../controllers/compliance.controller';

const router = Router();

// GET /api/compliance
router.get('/', getCompliance);

// POST /api/compliance
router.post('/', postCompliance);

// GET /api/compliance/:id
router.get('/:id', getComplianceById);

// GET /api/compliance/detailed
router.get('/detailed', getDetailedCompliance);

// POST /api/compliance/detailed
router.post('/detailed', postDetailedCompliance);

export default router;
