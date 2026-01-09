"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
console.log("User routes loaded", auth_1.authenticateToken);
// GET /api/user/role
router.get('/role', (req, res, next) => {
    console.log("🔍 [BACKEND] ===== USER ROLE ROUTE HIT =====");
    console.log("🔍 [BACKEND] Method:", req.method);
    console.log("🔍 [BACKEND] URL:", req.url);
    console.log("🔍 [BACKEND] Headers:", JSON.stringify(req.headers, null, 2));
    next();
}, auth_1.authenticateToken, user_controller_1.getUserRole);
exports.default = router;
//# sourceMappingURL=user.routes.js.map