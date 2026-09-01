import { createAdminClient } from '@/lib/supabase/admin';
import { authorizeCronRequest } from '@/lib/security/retention';

const INVITEE_ID = '10000000-0000-4000-8000-000000000004';
const INVITATION_ID = '30000000-0000-4000-8000-000000000001';
const INVITATION_ORG_ID = '20000000-0000-4000-8000-000000000003';
const INVITEE_EMAIL = 'e2e-invitee@example.invalid';
const INITIAL_PASSWORD = 'TrustOS-E2E-Accessible-2026!';

export async function POST(request: Request) {
  const secret = process.env.E2E_FIXTURE_SECRET;
  if (!secret) return new Response('Not found', { status: 404 });
  if (!authorizeCronRequest(request.headers.get('authorization'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();
  const revoke = await admin.rpc('revoke_trustos_user_sessions', { target_user: INVITEE_ID });
  if (revoke.error) return new Response('Fixture reset failed', { status: 500 });

  const updatedUser = await admin.auth.admin.updateUserById(INVITEE_ID, {
    password: INITIAL_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'Fictional Invited Administrator' },
  });
  if (updatedUser.error || updatedUser.data.user?.email !== INVITEE_EMAIL) {
    return new Response('Fixture reset failed', { status: 500 });
  }
  const cleanupRoles = await admin
    .from('module_role_assignments')
    .delete()
    .eq('organization_id', INVITATION_ORG_ID)
    .eq('user_id', INVITEE_ID);
  if (cleanupRoles.error) return new Response('Fixture reset failed', { status: 500 });

  const cleanupMembership = await admin
    .from('organization_memberships')
    .delete()
    .eq('organization_id', INVITATION_ORG_ID)
    .eq('user_id', INVITEE_ID);
  if (cleanupMembership.error) return new Response('Fixture reset failed', { status: 500 });

  const cleanupAcceptances = await admin
    .from('policy_acceptances')
    .delete()
    .eq('organization_id', INVITATION_ORG_ID)
    .eq('user_id', INVITEE_ID);
  if (cleanupAcceptances.error) return new Response('Fixture reset failed', { status: 500 });

  const resetInvitation = await admin
    .from('invitations')
    .update({
      status: 'pending',
      accepted_at: null,
      superseded_at: null,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', INVITATION_ID)
    .eq('email_normalized', INVITEE_EMAIL);
  if (resetInvitation.error) return new Response('Fixture reset failed', { status: 500 });
  const deleteIntent = await admin.from('invitation_module_roles').delete().eq('invitation_id', INVITATION_ID);
  if (deleteIntent.error) return new Response('Fixture reset failed', { status: 500 });

  const restoreIntent = await admin.from('invitation_module_roles').insert([
    { invitation_id: INVITATION_ID, module_id: 'trustops', role: 'module_admin' },
    { invitation_id: INVITATION_ID, module_id: 'grantflow', role: 'module_admin' },
  ]);
  if (restoreIntent.error) return new Response('Fixture reset failed', { status: 500 });

  const profile = await admin
    .from('profiles')
    .upsert({ user_id: INVITEE_ID, display_name: 'Fictional Invited Administrator' });
  if (profile.error) return new Response('Fixture reset failed', { status: 500 });

  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
