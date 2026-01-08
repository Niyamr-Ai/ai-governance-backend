import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware for Supabase JWT tokens
 * Verifies the Authorization header contains a valid Supabase JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('❌ No Authorization header provided');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    console.log('✅ Backend: Received Authorization header (first 50 chars):', authHeader.substring(0, 50) + '...');

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    console.log('✅ Backend: Extracted token (first 50 chars):', token.substring(0, 50) + '...');

    // Get Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ SUPABASE_JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT secret not configured'
      });
    }

    console.log('✅ Backend: JWT Secret configured (length):', jwtSecret.length);

    // Verify the JWT token
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;

      console.log('✅ Token verified successfully:', {
        user_id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      });

      // Attach user info to request
      req.user = decoded;
      next();

    } catch (jwtError: any) {
      console.log('❌ JWT verification failed:', {
        message: jwtError.message,
        name: jwtError.name
      });

      // Return 401 for invalid tokens
      return res.status(401).json({
        error: 'Invalid token',
        message: process.env.NODE_ENV === 'development' ? jwtError.message : 'Authentication failed'
      });
    }

  } catch (error: any) {
    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
}
