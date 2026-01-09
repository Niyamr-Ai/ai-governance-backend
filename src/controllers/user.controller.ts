/**
 * User API Controller
 *
 * GET /api/user/role - Get current user role
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

/**
 * GET /api/user/role
 * Returns the current user's role (user or admin/compliance)
 */
export async function getUserRole(req: Request, res: Response) {
  console.log("🚨🚨🚨 [BACKEND] GETUSERROLE CONTROLLER CALLED 🚨🚨🚨");
  console.log("🔍 [BACKEND] getUserRole called");
  console.log("🔍 [BACKEND] req.user:", req.user);
  console.log("🔍 [BACKEND] typeof req.user:", typeof req.user);

  try {
    console.log("🔍 [BACKEND] req.user exists:", !!req.user);

    if (!req.user) {
      console.log("❌ [BACKEND] No user found in request - middleware may not have run");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user!;
    const userId = user.sub;

    console.log("🔍 [BACKEND] User ID:", userId);
    console.log("🔍 [BACKEND] Full user object:", JSON.stringify(user, null, 2));

    // For now, return default user role
    // TODO: Implement proper role checking from database or JWT metadata
    const role = 'user';
    const isAdmin = false;

    console.log("✅ [BACKEND] Returning user role response");

    return res.status(200).json({
      userId: userId,
      role: 'user',
      rawRole: role
    });
  } catch (error: any) {
    console.error("❌ [BACKEND] GET /api/user/role error:", error);
    console.error("❌ [BACKEND] Error message:", error.message);
    console.error("❌ [BACKEND] Error stack:", error.stack);

    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }); 
  }
}
