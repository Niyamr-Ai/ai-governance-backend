/**
 * Auth Controller
 *
 * Handles authentication callback for Supabase auth flow
 */

import { Request, Response } from 'express';
import { createClient } from '../../utils/supabase/server';

/**
 * GET /api/auth/callback
 * Auth callback route for Supabase authentication flow
 */
export async function authCallbackHandler(req: Request, res: Response) {
  try {
    // The `/auth/callback` route is required for the server-side auth flow implemented
    // by the SSR package. It exchanges an auth code for the user's session.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const url = new URL(requestUrl);
    const code = url.searchParams.get("code");
    const origin = `${req.protocol}://${req.get('host')}`;
    const redirectTo = url.searchParams.get("redirect_to")?.toString();

    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    if (redirectTo) {
      return res.redirect(`${origin}${redirectTo}`);
    }

    // URL to redirect to after sign up process completes
    return res.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
