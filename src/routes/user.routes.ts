import { Router } from 'express';
import { getUserRole } from '../controllers/user.controller';

const router = Router();

// GET /api/user/role
router.get('/role', getUserRole);

export default router;
