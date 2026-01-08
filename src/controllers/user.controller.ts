/**
 * User API Controller
 *
 * GET /api/user/role - Get current user role
 */

import { Request, Response } from 'express';
import { createClient } from '../../utils/supabase/server';
import { getUserId } from '../../middleware/auth';

/**
 * GET /api/user/role
 * Returns the current user's role (user or admin/compliance)
 */
export async function getUserRole(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check role from user metadata
    const role = user.user.user_metadata?.role || 'user';
    const isAdmin = role === 'admin' || role === 'Admin' || role === 'compliance';

    return res.status(200).json({
      userId: user.user.id,
      role: isAdmin ? 'admin' : 'user',
      rawRole: role
    });
  } catch (error: any) {
    console.error("GET /api/user/role error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
