"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Log JWT secret length once at server start
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
if (jwtSecret) {
    console.log('🔐 JWT Secret configured (length):', jwtSecret.length);
}
else {
    console.error('❌ SUPABASE_JWT_SECRET not configured');
}
/**
 * Authentication middleware for Supabase JWT tokens
 * Verifies Authorization header and attaches userId to request
 */
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No authorization header provided'
            });
        }
        // Extract token from "Bearer <token>" format
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
        }
        // Log token first 30 chars when verifying
        console.log('🔍 Verifying token (first 30 chars):', token.substring(0, 30) + '...');
        // Verify the JWT token using HS256 (Legacy Supabase JWT secret)
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Extract user id from decoded `sub` and attach to req
            req.userId = decoded.sub;
            next();
        }
        catch (jwtError) {
            console.error('❌ JWT verification failed:', jwtError.message);
            return res.status(401).json({
                error: 'Invalid token',
                message: process.env.NODE_ENV === 'development' ? jwtError.message : 'Authentication failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Authentication middleware error:', error);
        return res.status(500).json({
            error: 'Authentication error',
            message: 'Internal server error during authentication'
        });
    }
}
//# sourceMappingURL=requireAuth.js.map