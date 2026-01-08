"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
// POST /api/chat
router.post('/chat', chat_controller_1.chatHandler);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map