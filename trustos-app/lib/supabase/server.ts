import 'server-only';

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

import { getPublicEnv } from '@/lib/env';
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options';

export type ServerClientOptions = {
  /** Pass response.headers from route handlers so Supabase cache headers ship. */
  responseHeaders?: Headers;
};

export async function createServerClient(options: ServerClientOptions = {}) {
  // Server Components cannot mutate response headers directly. Marking the
  // request dynamic delegates their cache policy to Next.js; response-owning
  // callers pass a mutable Headers sink above for Supabase's exact headers.
  await connection();

  const cookieStore = await cookies();
  const environment = getPublicEnv();

  return createSupabaseServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. The request proxy refreshes them.
          }

          Object.entries(headersToSet).forEach(([name, value]) => {
            options.responseHeaders?.set(name, value);
          });
        },
      },
    },
  );
}
