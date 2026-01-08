import { createClient } from "../utils/supabase/server";
import { Request } from 'express';

export async function getUserId(req: Request): Promise<string | false> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const supabase = await createClient();

    // Set the JWT token for this request
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // We'll handle refresh tokens separately if needed
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}
