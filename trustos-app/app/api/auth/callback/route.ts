import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { safeAuthCallbackPath } from '@/lib/actions/auth';
import { getServerEnv } from '@/lib/env';
import { createServerClient } from '@/lib/supabase/server';

const invitationIdSchema = z.string().uuid();

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const tokenType = request.nextUrl.searchParams.get('type');
  const next = safeAuthCallbackPath(request.nextUrl.searchParams.get('next'));
  const invitationId = invitationIdSchema.safeParse(
    request.nextUrl.searchParams.get('invitation'),
  );
  const { TRUSTOS_APP_ORIGIN } = getServerEnv();

  const hasInviteToken = Boolean(tokenHash) && tokenType === 'invite';
  if (!code && !hasInviteToken) {
    return NextResponse.redirect(
      new URL('/sign-in?error=session', TRUSTOS_APP_ORIGIN),
      303,
    );
  }

  const responseHeaders = new Headers();
  const supabase = await createServerClient({ responseHeaders });
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: 'invite',
      });

  if (error) {
    return NextResponse.redirect(
      new URL('/sign-in?error=session', TRUSTOS_APP_ORIGIN),
      303,
    );
  }

  const destination = new URL(next, TRUSTOS_APP_ORIGIN);
  if (next === '/accept-invitation' && invitationId.success) {
    destination.searchParams.set('invitation', invitationId.data);
  }

  const response = NextResponse.redirect(destination, 303);
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
