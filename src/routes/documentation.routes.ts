import { Router } from 'express';
import { authenticateToken } from "../middleware/auth";
import { getDocumentation, getDocumentationPDF } from '../controllers/documentation.controller';

const router = Router();

// GET /api/documentation
router.get('/', authenticateToken, getDocumentation);

// GET /api/documentation/:id/pdf
router.get('/:id/pdf', authenticateToken, getDocumentationPDF);

export default router;