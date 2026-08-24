'use client';

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

import { getPublicEnv } from '@/lib/env';
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options';

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

export type AnonymousBrowserClient = Pick<
  SupabaseBrowserClient,
  'from' | 'rpc'
>;

const browserAuthenticationError =
  'Browser authentication is unavailable; use a server action instead.';

function createAnonymousFacade(
  client: SupabaseBrowserClient,
): AnonymousBrowserClient {
  const publicDataClient: AnonymousBrowserClient = Object.freeze({
    from: client.from.bind(client),
    rpc: client.rpc.bind(client),
  });

  return new Proxy(publicDataClient, {
    get(target, property, receiver) {
      if (property === 'auth') {
        throw new Error(browserAuthenticationError);
      }

      return Reflect.get(target, property, receiver);
    },
  });
}

export function createBrowserClient() {
  const environment = getPublicEnv();

  const client = createSupabaseBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      // Browser JavaScript cannot create HttpOnly cookies. TrustOS keeps auth
      // state in server-managed cookies and uses this client without a session.
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          throw new Error(browserAuthenticationError);
        },
      },
      isSingleton: false,
    },
  );

  return createAnonymousFacade(client);
}
