import { Router } from 'express';
import { chatHandler } from '../controllers/chat.controller';

const router = Router();

// POST /api/chat
router.post('/chat', chatHandler);

export default router;
