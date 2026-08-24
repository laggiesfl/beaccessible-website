import 'server-only';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export const TRUSTOS_PRIVACY_VERSION = 'privacy-2026-08';
export const TRUSTOS_TERMS_VERSION = 'terms-2026-08';

const invitationIdSchema = z.string().uuid();
const activationSchema = z.object({
  invitationId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(100),
  password: z.string().min(12).max(1024),
  privacyAccepted: z.literal('on'),
  termsAccepted: z.literal('on'),
});

export type InvitationPreview = {
  invitationId: string;
  organizationName: string;
  organizationRole: 'client_admin' | 'team_member';
  modules: readonly { id: 'trustops' | 'grantflow'; name: string; role: string }[];
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function invitationErrorLocation(invitationId: string, code: string): string {
  const query = new URLSearchParams({ invitation: invitationId, error: code });
  return `/accept-invitation?${query.toString()}`;
}

export async function getInvitationPreview(
  invitationIdInput: string | undefined,
): Promise<InvitationPreview | null> {
  const userClient = await createServerClient();
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const verifiedUser = userData.user;
  if (userError || !verifiedUser?.email) return null;

  const admin = createAdminClient();
  const parsedId = invitationIdSchema.safeParse(invitationIdInput);
  let invitationQuery = admin
    .from('invitations')
    .select('id,organization_id,email_normalized,organization_role,status,expires_at,created_at');

  if (parsedId.success) {
    invitationQuery = invitationQuery.eq('id', parsedId.data);
  } else {
    invitationQuery = invitationQuery
      .eq('email_normalized', verifiedUser.email.trim().toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(2);
  }

  const { data: invitationRows, error: invitationError } = await invitationQuery;
  if (invitationError || !invitationRows || invitationRows.length !== 1) return null;
  const invitation = invitationRows[0];

  if (invitation.status !== 'pending') return null;
  if (new Date(invitation.expires_at).getTime() <= Date.now()) return null;
  if (String(invitation.email_normalized).trim().toLowerCase() !== verifiedUser.email.trim().toLowerCase()) {
    return null;
  }

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .select('name,status')
    .eq('id', invitation.organization_id)
    .maybeSingle();
  if (organizationError || !organization || organization.status !== 'active') return null;

  const { data: intendedRoles, error: rolesError } = await admin
    .from('invitation_module_roles')
    .select('module_id,role')
    .eq('invitation_id', invitation.id);
  if (rolesError || !intendedRoles) return null;

  const moduleIds = intendedRoles.map((entry) => entry.module_id);
  const { data: licensedModules, error: licencesError } = await admin
    .from('organization_modules')
    .select('module_id,status')
    .eq('organization_id', invitation.organization_id)
    .in('module_id', moduleIds.length ? moduleIds : ['__none__']);
  if (licencesError || !licensedModules) return null;

  const activeLicensedIds = new Set(
    licensedModules.filter((entry) => entry.status === 'active').map((entry) => entry.module_id),
  );
  if (intendedRoles.some((entry) => !activeLicensedIds.has(entry.module_id))) return null;

  const { data: moduleCatalog, error: catalogError } = await admin
    .from('module_catalog')
    .select('id,name')
    .in('id', moduleIds.length ? moduleIds : ['__none__']);
  if (catalogError || !moduleCatalog) return null;

  const moduleName = new Map(moduleCatalog.map((entry) => [entry.id, entry.name]));
  const modules = intendedRoles.map((entry) => ({
    id: entry.module_id as 'trustops' | 'grantflow',
    name: moduleName.get(entry.module_id) ?? entry.module_id,
    role: entry.role,
  }));

  return {
    invitationId: invitation.id,
    organizationName: organization.name,
    organizationRole: invitation.organization_role as 'client_admin' | 'team_member',
    modules,
  };
}

async function revokeAllSessions(
  userClient: Awaited<ReturnType<typeof createServerClient>>,
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  await userClient.auth.signOut({ scope: 'global' });
  await admin.rpc('revoke_trustos_user_sessions', { target_user: userId });
}

export async function acceptInvitationAction(formData: FormData) {
  'use server';

  const parsed = activationSchema.safeParse({
    invitationId: formString(formData, 'invitationId'),
    displayName: formString(formData, 'displayName'),
    password: formString(formData, 'password'),
    privacyAccepted: formString(formData, 'privacyAccepted'),
    termsAccepted: formString(formData, 'termsAccepted'),
  });

  if (!parsed.success) {
    const invitationId = invitationIdSchema.safeParse(formString(formData, 'invitationId'));
    redirect(invitationId.success ? invitationErrorLocation(invitationId.data, 'validation') : '/sign-in?error=session');
  }

  const userClient = await createServerClient();
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const verifiedUser = userData.user;
  if (userError || !verifiedUser?.id || !verifiedUser.email) {
    redirect('/sign-in?error=session');
  }

  const preview = await getInvitationPreview(parsed.data.invitationId);
  if (!preview) {
    redirect(invitationErrorLocation(parsed.data.invitationId, 'invalid'));
  }

  const { error: passwordError } = await userClient.auth.updateUser({
    password: parsed.data.password,
  });
  if (passwordError) {
    redirect(invitationErrorLocation(parsed.data.invitationId, 'password'));
  }

  const admin = createAdminClient();
  const { error: acceptanceError } = await admin.rpc('accept_trustos_invitation', {
    target_user: verifiedUser.id,
    invitation_id: parsed.data.invitationId,
    display_name: parsed.data.displayName,
    privacy_version: TRUSTOS_PRIVACY_VERSION,
    terms_version: TRUSTOS_TERMS_VERSION,
  });

  if (acceptanceError) {
    await revokeAllSessions(userClient, admin, verifiedUser.id);
    redirect('/sign-in?error=invitation');
  }

  const { data: platformStatus, error: platformStatusError } = await admin.rpc(
    'trustos_platform_admin_status',
    { target_user: verifiedUser.id },
  );

  if (platformStatusError) {
    await revokeAllSessions(userClient, admin, verifiedUser.id);
    redirect('/sign-in?error=platform-activation');
  }

  if (platformStatus === 'pending') {
    const previousAppMetadata = verifiedUser.app_metadata ?? {};
    const { error: metadataError } = await admin.auth.admin.updateUserById(verifiedUser.id, {
      app_metadata: { ...previousAppMetadata, platform_role: 'platform_admin' },
    });
    if (metadataError) {
      await revokeAllSessions(userClient, admin, verifiedUser.id);
      redirect('/sign-in?error=platform-activation');
    }

    const { data: activated, error: activationError } = await admin.rpc(
      'activate_trustos_platform_admin',
      { target_user: verifiedUser.id },
    );
    if (activationError || activated !== true) {
      await admin.auth.admin.updateUserById(verifiedUser.id, {
        app_metadata: previousAppMetadata,
      });
      await revokeAllSessions(userClient, admin, verifiedUser.id);
      redirect('/sign-in?error=platform-activation');
    }

    await revokeAllSessions(userClient, admin, verifiedUser.id);
    redirect('/sign-in?platform=activated');
  }

  redirect('/app');
}
