"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = getUserId;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getUserId(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        const token = authHeader.replace("Bearer ", "");
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET, { algorithms: ["HS256"] });
        return decoded.sub; // ✅ THIS is the user id
    }
    catch (err) {
        console.error("JWT verification failed:", err.message);
        return false;
    }
}
//# sourceMappingURL=auth.js.map