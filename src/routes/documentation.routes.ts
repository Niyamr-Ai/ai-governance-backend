import { Router } from 'express';
import { authenticateToken } from "../middleware/auth";
import { getDocumentation } from '../controllers/documentation.controller';

const router = Router();

// GET /api/documentation
router.get('/', authenticateToken, getDocumentation);

export default router;