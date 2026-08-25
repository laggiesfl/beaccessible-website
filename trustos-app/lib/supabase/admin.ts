import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { getServerEnv } from '@/lib/env';

function secretKeyFetch(secretKey: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const authorization = headers.get('authorization');

    if (secretKey.startsWith('sb_secret_') && authorization === `Bearer ${secretKey}`) {
      headers.delete('authorization');
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

export function createAdminClient() {
  const environment = getServerEnv();
  const secretKey = environment.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    secretKey,
    {
      global: {
        fetch: secretKeyFetch(secretKey),
      },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
