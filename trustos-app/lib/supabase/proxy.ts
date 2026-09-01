import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { getPublicEnv } from '@/lib/env';
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options';

const protectedPath = (pathname: string) =>
  pathname === '/app' || pathname.startsWith('/app/');

const sessionResponseHeaders = ['cache-control', 'expires', 'pragma'] as const;

function copySessionResponse(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  sessionResponseHeaders.forEach((name) => {
    const value = source.headers.get(name);

    if (value) {
      target.headers.set(name, value);
    }
  });
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const environment = getPublicEnv();
  const supabase = createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headersToSet).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  const isProtected = protectedPath(request.nextUrl.pathname);

  if ((error || !data?.claims) && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    const requestedPath = request.nextUrl.pathname + request.nextUrl.search;

    redirectUrl.pathname = '/sign-in';
    redirectUrl.search = `?next=${encodeURIComponent(requestedPath)}`;

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copySessionResponse(response, redirectResponse);

    return redirectResponse;
  }

  if (isProtected && data?.claims) {
    const sessionId = data.claims.session_id;
    const userId = data.claims.sub;
    if (typeof sessionId !== 'string' || typeof userId !== 'string') {
      const expiredUrl = request.nextUrl.clone();
      expiredUrl.pathname = '/sign-in';
      expiredUrl.search = '?error=session-expired';
      const expiredResponse = NextResponse.redirect(expiredUrl);
      copySessionResponse(response, expiredResponse);
      return expiredResponse;
    }

    const { data: touched, error: touchError } = await supabase.rpc('touch_own_trustos_app_session');
    if (touchError || !Array.isArray(touched) || touched.length !== 1) {
      const expiredUrl = request.nextUrl.clone();
      expiredUrl.pathname = '/sign-in';
      expiredUrl.search = '?error=session-expired';
      const expiredResponse = NextResponse.redirect(expiredUrl);
      copySessionResponse(response, expiredResponse);
      return expiredResponse;
    }
  }

  return response;
}
