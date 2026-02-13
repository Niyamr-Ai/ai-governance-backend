"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.getUserId = getUserId;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware: Authenticate Supabase JWT
 * - Expects Authorization: Bearer <access_token>
 * - Verifies token using SUPABASE_JWT_SECRET
 * - Attaches decoded token to req.user
 */
function authenticateToken(req, res, next) {
    console.log("🚨🚨🚨 [BACKEND] AUTHENTICATE TOKEN MIDDLEWARE CALLED 🚨🚨🚨");
    console.log("🔍 [BACKEND] === AUTHENTICATE TOKEN STARTED ===");
    console.log("🔍 [BACKEND] authenticateToken middleware called for:", req.method, req.url);
    console.log("🔍 [BACKEND] Headers present:", Object.keys(req.headers));
    console.log("🔍 [BACKEND] Authorization header:", req.headers.authorization ? "present" : "missing");
    try {
        const authHeader = req.headers.authorization;
        console.log("🔍 [BACKEND] Authorization header present:", !!authHeader);
        if (!authHeader) {
            console.log("❌ [BACKEND] No authorization header");
            return res.status(401).json({
                error: "Authentication required",
                message: "Missing Authorization header",
            });
        }
        // Expect: Bearer <token>
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;
        console.log("🔍 [BACKEND] Token extracted, length:", token ? token.length : 0);
        if (!token) {
            console.log("❌ [BACKEND] No token provided");
            return res.status(401).json({
                error: "Authentication required",
                message: "Token not provided",
            });
        }
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            console.error("❌ [BACKEND] SUPABASE_JWT_SECRET is not defined in environment variables");
            return res.status(500).json({
                error: "Server configuration error",
                message: "Missing JWT secret configuration"
            });
        }
        console.log("🔍 [BACKEND] Verifying JWT token using environment secret...");
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log("✅ [BACKEND] JWT token verified successfully");
        // Extract user information from JWT
        const user = {
            sub: decoded.sub,
            email: decoded.email,
            aud: decoded.aud,
            exp: decoded.exp,
            iat: decoded.iat,
            // Extract role from user_metadata if available
            role: decoded.user_metadata?.role || decoded.role
        };
        console.log("🔍 [BACKEND] Extracted user:", { sub: user.sub, email: user.email, role: user.role });
        // Attach decoded user to request
        req.user = user;
        console.log("✅ [BACKEND] User attached to request, calling next()");
        next();
    }
    catch (error) {
        console.error("❌ [BACKEND] Authentication failed:", error.message);
        console.error("❌ [BACKEND] Error type:", error.name);
        console.error("❌ [BACKEND] Error stack:", error.stack);
        return res.status(401).json({
            error: "Invalid or expired token",
            message: process.env.NODE_ENV === "development"
                ? error.message
                : "Authentication failed",
        });
    }
}
/**
 * Helper: Extract user ID from JWT token
 * - Expects Authorization: Bearer <access_token>
 * - Returns user ID (sub) or false if invalid
 */
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