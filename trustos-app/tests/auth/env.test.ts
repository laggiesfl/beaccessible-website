import { getPublicEnv, getServerEnv } from '@/lib/env';

const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
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
