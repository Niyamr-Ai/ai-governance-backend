"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// GET /api/auth/callback
router.get('/callback', auth_controller_1.authCallbackHandler);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map