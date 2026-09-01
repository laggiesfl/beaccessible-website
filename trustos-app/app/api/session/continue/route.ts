import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub || !data.claims.session_id) {
    return NextResponse.json({ error: 'session_required' }, { status: 401 });
  }

  const { data: touched, error: touchError } = await supabase.rpc('touch_own_trustos_app_session');
  if (touchError || !Array.isArray(touched) || touched.length !== 1) {
    await supabase.auth.signOut({ scope: 'local' });
    return NextResponse.json({ error: 'session_expired' }, { status: 401 });
  }

  return NextResponse.json({ continued: true }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
