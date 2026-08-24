import { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

const supabaseState = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  cookieOptions: null as Record<string, unknown> | null,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookieOptions: Record<string, unknown>;
      cookies: {
        setAll: (
          cookies: Array<{
            name: string;
            value: string;
            options: { httpOnly: boolean; sameSite: 'lax' };
          }>,
          headers: Record<string, string>,
        ) => void;
      };
    },
  ) => {
    supabaseState.cookieOptions = options.cookieOptions;

    return {
      auth: {
        getClaims: async () => {
          options.cookies.setAll(
            [
              {
                name: 'sb-session',
                value: 'refreshed-session',
                options: { httpOnly: true, sameSite: 'lax' },
              },
            ],
            { 'Cache-Control': 'private, no-store' },
          );

          return {
            data: supabaseState.claims
              ? { claims: supabaseState.claims }
              : null,
            error: null,
          };
        },
      },
    };
  },
}));

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'public-key-1234567890',
  );
  supabaseState.claims = null;
  supabaseState.cookieOptions = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('redirects an unauthenticated protected request and preserves refreshed cookies', async () => {
  const response = await updateSession(
    new NextRequest('https://trustos.example/app?tab=members'),
  );

  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe(
    'https://trustos.example/sign-in?next=%2Fapp%3Ftab%3Dmembers',
  );
  expect(response.cookies.get('sb-session')).toMatchObject({
    value: 'refreshed-session',
    httpOnly: true,
    sameSite: 'lax',
  });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(supabaseState.cookieOptions).toEqual({
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false,
  });
});

test('keeps a public sign-in request available and copies refreshed cookies', async () => {
  supabaseState.claims = { sub: 'user-123' };

  const response = await updateSession(
    new NextRequest('https://trustos.example/sign-in'),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
  expect(response.cookies.get('sb-session')?.value).toBe('refreshed-session');
});

test('keeps an authenticated protected request accessible', async () => {
  supabaseState.claims = { sub: 'user-123' };

  const response = await updateSession(
    new NextRequest('https://trustos.example/app'),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
});

test('keeps an unauthenticated sign-in request accessible', async () => {
  const response = await updateSession(
    new NextRequest('https://trustos.example/sign-in'),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
});
