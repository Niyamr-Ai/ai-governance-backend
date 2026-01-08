import { Router } from 'express';
import { getDocumentation } from '../controllers/documentation.controller';

const router = Router();

// GET /api/documentation
router.get('/', getDocumentation);

export default router;