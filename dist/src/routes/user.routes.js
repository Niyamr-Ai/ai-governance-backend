"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// GET /api/user/role
router.get('/role', user_controller_1.getUserRole);
exports.default = router;
//# sourceMappingURL=user.routes.js.map