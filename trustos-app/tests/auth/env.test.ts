import { getPublicEnv, getServerEnv } from '@/lib/env';

const TRUSTOS_PROJECT_URL = 'https://napjcycxzyrsruiifuca.supabase.co';
const SHARED_BEACCESSIBLE_URL = 'https://uuvxqyrqhqktkeovkivx.supabase.co';

const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: TRUSTOS_PROJECT_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key-1234567890',
};

test('rejects missing public Supabase configuration', () => {
  expect(() => getPublicEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_URL');
});

test('never returns the service role from public configuration', () => {
  const env = getPublicEnv({
    ...publicEnv,
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret-1234567890',
  });

  expect(env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
});

test('requires the service role only through server configuration', () => {
  expect(() =>
    getServerEnv({
      ...publicEnv,
      CRON_SECRET: 'cron-secret-12345678901234567890',
      RATE_LIMIT_HMAC_KEY: 'rate-limit-key-12345678901234567',
    }),
  ).toThrow('SUPABASE_SERVICE_ROLE_KEY');
});

test('rejects the shared BeAccessible Supabase project', () => {
  expect(() =>
    getPublicEnv({
      ...publicEnv,
      NEXT_PUBLIC_SUPABASE_URL: SHARED_BEACCESSIBLE_URL,
      NODE_ENV: 'production',
    }),
  ).toThrow('dedicated TrustOS Supabase project');
});

test('rejects any other hosted Supabase project', () => {
  expect(() =>
    getPublicEnv({
      ...publicEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NODE_ENV: 'production',
    }),
  ).toThrow('dedicated TrustOS Supabase project');
});

test('rejects local Supabase in production', () => {
  expect(() =>
    getPublicEnv({
      ...publicEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NODE_ENV: 'production',
    }),
  ).toThrow('dedicated TrustOS Supabase project');
});

test('permits local Supabase only outside production', () => {
  expect(() =>
    getPublicEnv({
      ...publicEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NODE_ENV: 'development',
    }),
  ).not.toThrow();
});
