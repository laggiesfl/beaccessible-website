import { getServerEnv } from '@/lib/env';
import { hashRateLimitSubject } from '@/lib/security/rate-limit';
import { authorizeCronRequest } from '@/lib/security/retention';
import { createAdminClient } from '@/lib/supabase/admin';

const INVITEE_ID = '10000000-0000-4000-8000-000000000004';
const INVITATION_ID = '30000000-0000-4000-8000-000000000001';
const INVITATION_ORG_ID = '20000000-0000-4000-8000-000000000003';
const INVITEE_EMAIL = 'e2e-invitee@example.invalid';
const CLIENT_B_ID = '10000000-0000-4000-8000-000000000003';
const CLIENT_B_ORG_ID = '20000000-0000-4000-8000-000000000002';
const INITIAL_PASSWORD = 'TrustOS-E2E-Accessible-2026!';
const E2E_RATE_LIMIT_EMAILS = [
  'e2e-platform-admin@example.invalid', 'e2e-client-a@example.invalid',
  'e2e-client-b@example.invalid', INVITEE_EMAIL, 'e2e-viewer@example.invalid',
  'e2e-contributor@example.invalid', 'e2e-reviewer@example.invalid',
  'e2e-approver@example.invalid', 'e2e-module-admin@example.invalid',
  'unknown-e2e-user@example.invalid',
];
const SCENARIOS = new Set([
  'baseline',
  'invitation_expired',
  'client_b_unlicensed',
  'client_b_suspended',
  'client_b_membership_removed',
]);

function failed() {
  return new Response('Fixture reset failed', { status: 500 });
}

export async function POST(request: Request) {
  const secret = process.env.E2E_FIXTURE_SECRET;
  if (!secret) return new Response('Not found', { status: 404 });
  if (!authorizeCronRequest(request.headers.get('authorization'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { scenario?: unknown };
  const scenario = typeof body.scenario === 'string' ? body.scenario : 'baseline';
  if (!SCENARIOS.has(scenario)) return new Response('Unknown fixture scenario', { status: 400 });

  const admin = createAdminClient();
  const rateLimitKey = getServerEnv().RATE_LIMIT_HMAC_KEY;
  const rateLimitHashes = E2E_RATE_LIMIT_EMAILS.map((email) => hashRateLimitSubject(email, rateLimitKey));
  const resetRateLimits = await admin.rpc('reset_trustos_rate_limit_state', {
    target_buckets: ['sign_in', 'password_recovery'],
    target_subject_hashes: rateLimitHashes,
  });
  if (resetRateLimits.error) return failed();
  const revoke = await admin.rpc('revoke_trustos_user_sessions', { target_user: INVITEE_ID });
  if (revoke.error) return failed();

  const updatedUser = await admin.auth.admin.updateUserById(INVITEE_ID, {
    password: INITIAL_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'Fictional Invited Administrator' },
  });
  if (updatedUser.error || updatedUser.data.user?.email !== INVITEE_EMAIL) return failed();

  const cleanupRoles = await admin.from('module_role_assignments').delete()
    .eq('organization_id', INVITATION_ORG_ID).eq('user_id', INVITEE_ID);
  if (cleanupRoles.error) return failed();
  const cleanupMembership = await admin.from('organization_memberships').delete()
    .eq('organization_id', INVITATION_ORG_ID).eq('user_id', INVITEE_ID);
  if (cleanupMembership.error) return failed();
  const cleanupAcceptances = await admin.from('policy_acceptances').delete()
    .eq('organization_id', INVITATION_ORG_ID).eq('user_id', INVITEE_ID);
  if (cleanupAcceptances.error) return failed();

  const resetInvitation = await admin.from('invitations').update({
    status: 'pending', accepted_at: null, superseded_at: null,
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  }).eq('id', INVITATION_ID).eq('email_normalized', INVITEE_EMAIL);
  if (resetInvitation.error) return failed();
  const deleteIntent = await admin.from('invitation_module_roles').delete().eq('invitation_id', INVITATION_ID);
  if (deleteIntent.error) return failed();
  const restoreIntent = await admin.from('invitation_module_roles').insert([
    { invitation_id: INVITATION_ID, module_id: 'trustops', role: 'module_admin' },
    { invitation_id: INVITATION_ID, module_id: 'grantflow', role: 'module_admin' },
  ]);
  if (restoreIntent.error) return failed();
  const profile = await admin.from('profiles')
    .upsert({ user_id: INVITEE_ID, display_name: 'Fictional Invited Administrator' });
  if (profile.error) return failed();

  const restoreOrg = await admin.from('organizations').update({ status: 'active', suspended_at: null })
    .eq('id', CLIENT_B_ORG_ID);
  if (restoreOrg.error) return failed();
  const restoreMembership = await admin.from('organization_memberships')
    .update({ status: 'active', deactivated_at: null })
    .eq('organization_id', CLIENT_B_ORG_ID).eq('user_id', CLIENT_B_ID);
  if (restoreMembership.error) return failed();
  const restoreGrantFlow = await admin.from('organization_modules')
    .update({ status: 'active', disabled_at: null })
    .eq('organization_id', CLIENT_B_ORG_ID).eq('module_id', 'grantflow');
  if (restoreGrantFlow.error) return failed();

  if (scenario === 'invitation_expired') {
    const result = await admin.from('invitations').update({
      status: 'expired', expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }).eq('id', INVITATION_ID).eq('email_normalized', INVITEE_EMAIL);
    if (result.error) return failed();
  } else if (scenario === 'client_b_unlicensed') {
    const result = await admin.from('organization_modules')
      .update({ status: 'inactive', disabled_at: new Date().toISOString() })
      .eq('organization_id', CLIENT_B_ORG_ID).eq('module_id', 'grantflow');
    if (result.error) return failed();
  } else if (scenario === 'client_b_suspended') {
    const result = await admin.from('organizations')
      .update({ status: 'suspended', suspended_at: new Date().toISOString() }).eq('id', CLIENT_B_ORG_ID);
    if (result.error) return failed();
  } else if (scenario === 'client_b_membership_removed') {
    const result = await admin.from('organization_memberships')
      .update({ status: 'inactive', deactivated_at: new Date().toISOString() })
      .eq('organization_id', CLIENT_B_ORG_ID).eq('user_id', CLIENT_B_ID);
    if (result.error) return failed();
  }

  return Response.json({ ok: true, scenario }, { headers: { 'Cache-Control': 'no-store' } });
}
