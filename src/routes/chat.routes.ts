import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { chatHandler } from '../controllers/chat.controller';

const router = Router();

// POST /api/chat
router.post('/chat', authenticateToken, chatHandler);

export default router;
