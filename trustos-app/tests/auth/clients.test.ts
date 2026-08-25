const clientState = vi.hoisted(() => ({
  adminCall: null as null | {
    url: string;
    key: string;
    options: Record<string, unknown>;
  },
  browserCall: null as null | {
    url: string;
    key: string;
    options: {
      auth: Record<string, unknown>;
      cookieOptions: Record<string, unknown>;
      cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        setAll: () => void;
      };
      isSingleton: boolean;
    };
  },
  serverCall: null as null | {
    url: string;
    key: string;
    options: {
      cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        setAll: (
          cookies: Array<{
            name: string;
            value: string;
            options: Record<string, unknown>;
          }>,
          headers: Record<string, string>,
        ) => void;
      };
      cookieOptions: Record<string, unknown>;
    };
  },
  cookiesRead: [{ name: 'sb-session', value: 'current-session' }],
  cookiesWritten: [] as Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }>,
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => clientState.cookiesRead,
    set: (
      name: string,
      value: string,
      options: Record<string, unknown>,
    ) => {
      clientState.cookiesWritten.push({ name, value, options });
    },
  }),
}));

vi.mock('next/server', () => ({
  connection: async () => undefined,
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: (
    url: string,
    key: string,
    options: NonNullable<typeof clientState.browserCall>['options'],
  ) => {
    clientState.browserCall = { url, key, options };
    return {
      from: (relation: string) => ({ relation }),
      rpc: (fn: string, args: Record<string, unknown>) => ({ args, fn }),
    };
  },
  createServerClient: (
    url: string,
    key: string,
    options: NonNullable<typeof clientState.serverCall>['options'],
  ) => {
    clientState.serverCall = { url, key, options };
    return { kind: 'server-client' };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (
    url: string,
    key: string,
    options: Record<string, unknown>,
  ) => {
    clientState.adminCall = { url, key, options };
    return { kind: 'admin-client' };
  },
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { createBrowserClient } from '@/lib/supabase/browser';
import { createServerClient } from '@/lib/supabase/server';

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://napjcycxzyrsruiifuca.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key-1234567890',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-1234567890',
  CRON_SECRET: 'cron-secret-12345678901234567890',
  RATE_LIMIT_HMAC_KEY: 'rate-limit-key-12345678901234567',
  TRUSTOS_APP_ORIGIN: 'https://trustos-phase-2-preview.vercel.app',
};

beforeEach(() => {
  Object.entries(environment).forEach(([name, value]) => {
    vi.stubEnv(name, value);
  });
  clientState.adminCall = null;
  clientState.browserCall = null;
  clientState.serverCall = null;
  clientState.cookiesWritten.length = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('creates a sessionless public-data browser client', () => {
  const client = createBrowserClient();

  expect(client.from('public_catalog')).toEqual({
    relation: 'public_catalog',
  });
  expect(client.rpc('public_status', { module: 'trustops' })).toEqual({
    args: { module: 'trustops' },
    fn: 'public_status',
  });
  expect(Object.keys(client)).toEqual(['from', 'rpc']);
  expect(() => (client as unknown as { auth: unknown }).auth).toThrow(
    'Browser authentication is unavailable',
  );
  expect(clientState.browserCall).toMatchObject({
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    key: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options: {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      cookieOptions: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
      isSingleton: false,
    },
  });
  expect(JSON.stringify(clientState.browserCall)).not.toContain(
    environment.SUPABASE_SERVICE_ROLE_KEY,
  );
});

test('creates a per-request server client with hardened cookies and response headers', async () => {
  const responseHeaders = new Headers();

  expect(await createServerClient({ responseHeaders })).toEqual({
    kind: 'server-client',
  });
  expect(clientState.serverCall).toMatchObject({
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    key: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options: {
      cookieOptions: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    },
  });
  expect(clientState.serverCall?.options.cookies.getAll()).toEqual(
    clientState.cookiesRead,
  );

  clientState.serverCall?.options.cookies.setAll(
    [
      {
        name: 'sb-session',
        value: 'updated-session',
        options: { httpOnly: true },
      },
    ],
    {
      'Cache-Control': 'private, no-store',
      Expires: '0',
      Pragma: 'no-cache',
    },
  );

  expect(clientState.cookiesWritten).toEqual([
    {
      name: 'sb-session',
      value: 'updated-session',
      options: { httpOnly: true },
    },
  ]);
  expect(responseHeaders.get('cache-control')).toBe('private, no-store');
  expect(responseHeaders.get('expires')).toBe('0');
  expect(responseHeaders.get('pragma')).toBe('no-cache');
});

test('creates a non-persistent admin client with the service-role key', () => {
  expect(createAdminClient()).toEqual({ kind: 'admin-client' });
  expect(clientState.adminCall).toEqual({
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    key: environment.SUPABASE_SERVICE_ROLE_KEY,
    options: {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  });
});
