import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Extend Express Request to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        role?: string;
        aud?: string;
        exp?: number;
        iat?: number;
      };
    }
  }
}

/**
 * Middleware: Authenticate Supabase JWT
 * - Expects Authorization: Bearer <access_token>
 * - Verifies token using SUPABASE_JWT_SECRET
 * - Attaches decoded token to req.user
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
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

    // Temporarily hardcode the JWT secret for testing
    const jwtSecret = "5V1G+wSmUsel/CIkgtIHrdqlOmyRDHIBH1M4L0Dt6sQYZuJG9+Gmt+/vMAfC9o7P093J3UJg7O4BEl8bNBL8mw==";
    console.log("🔍 [BACKEND] Using hardcoded JWT secret, length:", jwtSecret.length);

    console.log("🔍 [BACKEND] Verifying JWT token...");
    const decoded = jwt.verify(token, jwtSecret) as any;
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
  } catch (error: any) {
    console.error("❌ [BACKEND] Authentication failed:", error.message);
    console.error("❌ [BACKEND] Error type:", error.name);
    console.error("❌ [BACKEND] Error stack:", error.stack);

    return res.status(401).json({
      error: "Invalid or expired token",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Authentication failed",
    });
}}

/**
 * Helper: Extract user ID from JWT token
 * - Expects Authorization: Bearer <access_token>
 * - Returns user ID (sub) or false if invalid
 */
export function getUserId(req: Request): string | false {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!, { algorithms: ["HS256"] }) as any;

    return decoded.sub; // ✅ THIS is the user id
  } catch (err: any) {
    console.error("JWT verification failed:", err.message);
    return false;
  }
}