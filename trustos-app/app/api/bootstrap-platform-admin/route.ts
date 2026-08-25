import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const origin = process.env.TRUSTOS_APP_ORIGIN;

  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!platformAdminEmail || !origin) {
    return NextResponse.json({ ok: false, code: 'bootstrap_config_missing' }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ ok: false, code: 'user_lookup_failed' }, { status: 500 });
  }

  let user = usersData.users.find((candidate) => candidate.email?.toLowerCase() === platformAdminEmail);
  let createdUser = false;

  if (!user) {
    const redirectTo = `${origin}/api/auth/callback?next=/accept-invitation`;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(platformAdminEmail, { redirectTo });
    if (error || !data.user) {
      return NextResponse.json({ ok: false, code: 'auth_invitation_failed' }, { status: 500 });
    }
    user = data.user;
    createdUser = true;
  }

  const { data: invitationId, error: bootstrapError } = await admin.rpc('bootstrap_trustos_platform_admin', {
    target_user: user.id,
    target_email: platformAdminEmail,
  });

  if (bootstrapError) {
    if (createdUser) {
      await admin.auth.admin.deleteUser(user.id);
    }
    if (bootstrapError.message.includes('platform_bootstrap_already_configured')) {
      return NextResponse.json({ ok: true, code: 'already_bootstrapped' });
    }
    return NextResponse.json({ ok: false, code: 'platform_bootstrap_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: 'bootstrap_created', invitationId });
}
