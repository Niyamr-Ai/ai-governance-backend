"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
async function createClient() {
    const cookieStore = await (0, headers_1.cookies)(); // ✅ async in YOUR Next.js version
    return (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            async getAll() {
                return cookieStore.getAll();
            },
            async setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                }
                catch {
                    // Safe to ignore in Server Components
                }
            },
        },
    });
}
//# sourceMappingURL=server.js.map