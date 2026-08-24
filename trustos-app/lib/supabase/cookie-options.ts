import type { CookieOptionsWithName } from '@supabase/ssr';

export function getSupabaseCookieOptions(
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
): CookieOptionsWithName {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: nodeEnvironment === 'production',
  };
}
