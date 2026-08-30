import 'server-only';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import type { ModuleRole } from '@/lib/authz/types';

const emailSchema = z.string().trim().toLowerCase().email();
const userIdSchema = z.string().uuid();
const moduleIdSchema = z.enum(['trustops', 'grantflow']);
const moduleRoleSchema = z.enum([
  'module_admin',
  'contributor',
  'reviewer',
  'approver',
  'viewer',
]);

const ROLE_LABELS: Record<ModuleRole, string> = {
  module_admin: 'Module administrator',
  contributor: 'Contributor',
  reviewer: 'Reviewer',
  approver: 'Approver',
  viewer: 'Viewer',
};

const MODULE_LABELS: Record<string, string> = {
  trustops: 'TrustOps',
  grantflow: 'GrantFlow',
};

type AdminClient = ReturnType<typeof createAdminClient>;

type ClientAdminContext = {
  userId: string;
  organizationId: string;
  organizationName: string;
  admin: AdminClient;
};

export type TeamMemberView = {
  userId: string;
  email: string;
  displayName: string;
  organizationRole: 'client_admin' | 'team_member';
  roles: Array<{ moduleId: 'trustops' | 'grantflow'; role: ModuleRole }>;
};

export type TeamAdminView = {
  currentUserId: string;
  organization: { id: string; name: string };
  licensedModules: Array<{ id: 'trustops' | 'grantflow'; name: string }>;
  members: TeamMemberView[];
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function checked(formData: FormData, key: string): boolean {
  return formString(formData, key) === 'on';
}

function teamResult(code: string, section = 'members', member?: string): never {
  const params = new URLSearchParams({ section, result: code });
  if (member) params.set('member', member);
  redirect(`/app/admin/team?${params.toString()}`);
}

function roleResult(code: 'role-assigned' | 'role-revoked', member: string, moduleId: string, role: string): never {
  const params = new URLSearchParams({ section: 'members', result: code, member, module: moduleId, role });
  redirect(`/app/admin/team?${params.toString()}#role-action-feedback`);
}

async function requireClientAdmin(): Promise<ClientAdminContext> {
  const userClient = await createServerClient();
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;

  if (userError || !user?.id) {
    redirect('/sign-in?error=session');
  }

  const admin = createAdminClient();
  const { data: memberships, error: membershipError } = await admin
    .from('organization_memberships')
    .select('organization_id,organization_role,status')
    .eq('user_id', user.id)
    .eq('organization_role', 'client_admin')
    .eq('status', 'active')
    .limit(2);

  if (membershipError || !memberships || memberships.length !== 1) {
    redirect('/app?error=client-admin-required');
  }

  const organizationId = memberships[0].organization_id;
  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .select('id,name,status')
    .eq('id', organizationId)
    .maybeSingle();

  if (organizationError || !organization || organization.status !== 'active') {
    redirect('/app?error=client-admin-required');
  }

  return {
    userId: user.id,
    organizationId,
    organizationName: organization.name,
    admin,
  };
}

export async function getTeamAdminView(): Promise<TeamAdminView> {
  const { userId, organizationId, organizationName, admin } = await requireClientAdmin();

  const { data: modules, error: modulesError } = await admin
    .from('organization_modules')
    .select('module_id,status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('module_id');
  if (modulesError) throw new Error('TrustOS could not load module licences');

  const { data: memberships, error: membershipsError } = await admin
    .from('organization_memberships')
    .select('user_id,organization_role,status')
    .eq('organization_id', organizationId)
    .eq('status', 'active');
  if (membershipsError) throw new Error('TrustOS could not load team members');

  const memberIds = (memberships ?? []).map((item) => item.user_id);
  const profiles = memberIds.length
    ? await admin.from('profiles').select('user_id,display_name').in('user_id', memberIds)
    : { data: [], error: null };
  if (profiles.error) throw new Error('TrustOS could not load team profiles');

  const roleAssignments = memberIds.length
    ? await admin
        .from('module_role_assignments')
        .select('user_id,module_id,role,status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .in('user_id', memberIds)
    : { data: [], error: null };
  if (roleAssignments.error) throw new Error('TrustOS could not load team roles');

  const { data: authUsers, error: authUsersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (authUsersError) throw new Error('TrustOS could not load team email addresses');

  const profileMap = new Map(
    (profiles.data ?? []).map((profile) => [profile.user_id, profile.display_name]),
  );
  const emailMap = new Map(
    authUsers.users
      .filter((authUser) => memberIds.includes(authUser.id))
      .map((authUser) => [authUser.id, authUser.email ?? 'Email unavailable']),
  );
  const rolesByUser = new Map<string, TeamMemberView['roles']>();

  for (const assignment of roleAssignments.data ?? []) {
    const list = rolesByUser.get(assignment.user_id) ?? [];
    list.push({
      moduleId: assignment.module_id as 'trustops' | 'grantflow',
      role: assignment.role as ModuleRole,
    });
    rolesByUser.set(assignment.user_id, list);
  }

  const members = (memberships ?? [])
    .map((membership) => ({
      userId: membership.user_id,
      email: emailMap.get(membership.user_id) ?? 'Email unavailable',
      displayName: profileMap.get(membership.user_id) ?? 'Unnamed member',
      organizationRole: membership.organization_role as 'client_admin' | 'team_member',
      roles: rolesByUser.get(membership.user_id) ?? [],
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    currentUserId: userId,
    organization: { id: organizationId, name: organizationName },
    licensedModules: (modules ?? []).map((module) => ({
      id: module.module_id as 'trustops' | 'grantflow',
      name: MODULE_LABELS[module.module_id] ?? module.module_id,
    })),
    members,
  };
}

function parseRoleSelections(formData: FormData) {
  const selections = formData.getAll('roles');
  const roles = new Map<string, { module_id: 'trustops' | 'grantflow'; role: ModuleRole }>();

  for (const selection of selections) {
    if (typeof selection !== 'string') continue;
    const [moduleValue, roleValue, extra] = selection.split(':');
    const moduleId = moduleIdSchema.safeParse(moduleValue);
    const role = moduleRoleSchema.safeParse(roleValue);
    if (extra !== undefined || !moduleId.success || !role.success) continue;
    roles.set(`${moduleId.data}:${role.data}`, {
      module_id: moduleId.data,
      role: role.data,
    });
  }

  return [...roles.values()];
}

export async function inviteTeamMemberAction(formData: FormData) {
  'use server';
  const email = emailSchema.safeParse(formString(formData, 'email'));
  const roles = parseRoleSelections(formData);
  if (!email.success || roles.length === 0) {
    teamResult('invitation-invalid', 'invite');
  }

  const { userId, organizationId, admin } = await requireClientAdmin();
  const { data: invitationId, error: invitationError } = await admin.rpc(
    'trustos_client_create_team_invitation',
    {
      actor_user: userId,
      target_org: organizationId,
      target_email: email.data,
      target_roles: roles,
    },
  );

  if (invitationError?.message.includes('invitation_already_pending')) {
    teamResult('invitation-pending', 'invite');
  }
  if (invitationError?.message.includes('member_already_active')) {
    teamResult('member-already-active', 'invite');
  }
  if (invitationError?.message.includes('invitation_unlicensed_module')) {
    teamResult('unlicensed-role', 'invite');
  }
  if (invitationError || typeof invitationId !== 'string') {
    teamResult('invitation-failed', 'invite');
  }

  const { TRUSTOS_APP_ORIGIN } = getServerEnv();
  const redirectTo = new URL('/api/auth/callback', TRUSTOS_APP_ORIGIN);
  redirectTo.searchParams.set('next', '/accept-invitation');
  redirectTo.searchParams.set('invitation', invitationId);

  const { error: deliveryError } = await admin.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: redirectTo.toString(),
  });

  if (deliveryError) {
    await admin.rpc('trustos_client_cancel_team_invitation', {
      actor_user: userId,
      target_org: organizationId,
      target_invitation: invitationId,
      cancellation_reason: 'delivery_failed',
    });
    teamResult('invitation-delivery-failed', 'invite');
  }

  revalidatePath('/app/admin/team');
  teamResult('invitation-sent', 'members');
}

export async function setTeamMemberRoleAction(formData: FormData) {
  'use server';
  const targetUser = userIdSchema.safeParse(formString(formData, 'targetUser'));
  const moduleId = moduleIdSchema.safeParse(formString(formData, 'moduleId'));
  const role = moduleRoleSchema.safeParse(formString(formData, 'role'));
  const enabled = formString(formData, 'enabled');

  if (
    !targetUser.success ||
    !moduleId.success ||
    !role.success ||
    !['true', 'false'].includes(enabled)
  ) {
    teamResult('role-invalid', 'members');
  }

  const { userId, organizationId, admin } = await requireClientAdmin();
  const { error } = await admin.rpc('trustos_client_set_module_role', {
    actor_user: userId,
    target_org: organizationId,
    target_user: targetUser.data,
    target_module: moduleId.data,
    target_role: role.data,
    target_enabled: enabled === 'true',
  });

  if (error?.message.includes('module_not_licensed')) {
    teamResult('unlicensed-role', 'members', targetUser.data);
  }
  if (error?.message.includes('member_not_active')) {
    teamResult('member-not-active', 'members');
  }
  if (error) teamResult('role-failed', 'members', targetUser.data);

  revalidatePath('/app/admin/team');
  revalidatePath('/app');
  roleResult(
    enabled === 'true' ? 'role-assigned' : 'role-revoked',
    targetUser.data,
    moduleId.data,
    role.data,
  );
}

export async function deactivateTeamMemberAction(formData: FormData) {
  'use server';
  const targetUser = userIdSchema.safeParse(formString(formData, 'targetUser'));
  if (!targetUser.success || !checked(formData, 'confirmDeactivation')) {
    teamResult('deactivation-not-confirmed', 'members');
  }

  const { userId, organizationId, admin } = await requireClientAdmin();
  if (targetUser.data === userId) {
    teamResult('deactivation-self-denied', 'members', targetUser.data);
  }

  const { error } = await admin.rpc('trustos_client_deactivate_team_member', {
    actor_user: userId,
    target_org: organizationId,
    target_user: targetUser.data,
  });

  if (error?.message.includes('team_member_not_active')) {
    teamResult('member-not-active', 'members');
  }
  if (error) teamResult('deactivation-failed', 'members', targetUser.data);

  revalidatePath('/app/admin/team');
  revalidatePath('/app');
  teamResult('member-deactivated', 'members');
}

export function teamRoleLabel(role: ModuleRole): string {
  return ROLE_LABELS[role];
}
