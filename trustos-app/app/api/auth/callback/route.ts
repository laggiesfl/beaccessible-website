import { NextRequest, NextResponse } from 'next/server';

import { safeAuthCallbackPath } from '@/lib/actions/auth';
import { getServerEnv } from '@/lib/env';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeAuthCallbackPath(request.nextUrl.searchParams.get('next'));
  const { TRUSTOS_APP_ORIGIN } = getServerEnv();

  if (!code) {
    return NextResponse.redirect(
      new URL('/sign-in?error=session', TRUSTOS_APP_ORIGIN),
      303,
    );
  }

  const responseHeaders = new Headers();
  const supabase = await createServerClient({ responseHeaders });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/sign-in?error=session', TRUSTOS_APP_ORIGIN),
      303,
    );
  }

  const response = NextResponse.redirect(new URL(next, TRUSTOS_APP_ORIGIN), 303);
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
