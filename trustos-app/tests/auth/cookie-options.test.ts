import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options';

test('hardens server-managed session cookies in production', () => {
  expect(getSupabaseCookieOptions('production')).toEqual({
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });
});

test('keeps local HTTP development usable without weakening other attributes', () => {
  expect(getSupabaseCookieOptions('development')).toEqual({
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false,
  });
});
