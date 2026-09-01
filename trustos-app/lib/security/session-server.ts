import 'server-only';

import { FRESH_AUTH_LIMIT_MS } from '@/lib/security/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export async function registerCurrentAppSession(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
) {
  const { data, error } = await supabase.auth.getClaims();
  const sessionId = data?.claims?.session_id;
  if (error || typeof sessionId !== 'string') throw new Error('TrustOS session registration failed');
  const { error: registrationError } = await createAdminClient().rpc('register_trustos_app_session', {
    target_session: sessionId,
    target_user: userId,
  });
  if (registrationError) throw new Error('TrustOS session registration failed');
}

export async function requireFreshSession() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const issuedAt = Number(data?.claims?.iat ?? 0) * 1000;
  if (error || !issuedAt || Date.now() - issuedAt > FRESH_AUTH_LIMIT_MS) {
    throw Object.assign(new Error('Please sign in again before making this sensitive change.'), {
      code: 'fresh_auth_required',
    });
  }
}
