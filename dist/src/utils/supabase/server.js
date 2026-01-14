"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
}
async function createClient() {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey);
}
//# sourceMappingURL=server.js.map