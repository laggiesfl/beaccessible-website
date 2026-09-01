import { NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/audit/events';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    await recordAuditEvent({
      actorUserId: data.user.id,
      eventType: 'session_revoked',
      outcome: 'succeeded',
      metadata: { source: 'session_timeout' },
    });
    await createAdminClient().rpc('revoke_trustos_user_sessions', {
      target_user: data.user.id,
    });
  }

  await supabase.auth.signOut({ scope: 'global' });
  return NextResponse.json({ signedOut: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
