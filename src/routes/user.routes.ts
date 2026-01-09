import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserRole } from '../controllers/user.controller';

const router = Router();

console.log("User routes loaded", authenticateToken);


// GET /api/user/role
router.get('/role', (req, res, next) => {
  console.log("🔍 [BACKEND] ===== USER ROLE ROUTE HIT =====");
  console.log("🔍 [BACKEND] Method:", req.method);
  console.log("🔍 [BACKEND] URL:", req.url);
  console.log("🔍 [BACKEND] Headers:", JSON.stringify(req.headers, null, 2));
  next();
}, authenticateToken, getUserRole);

export default router;
