import { Router } from 'express';
import { authCallbackHandler } from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/callback
router.get('/callback', authCallbackHandler);

export default router;
