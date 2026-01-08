"use strict";
/**
 * User API Controller
 *
 * GET /api/user/role - Get current user role
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRole = getUserRole;
const server_1 = require("../../utils/supabase/server");
const auth_1 = require("../../middleware/auth");
/**
 * GET /api/user/role
 * Returns the current user's role (user or admin/compliance)
 */
async function getUserRole(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const supabase = await (0, server_1.createClient)();
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
    }
    catch (error) {
        console.error("GET /api/user/role error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
//# sourceMappingURL=user.controller.js.map