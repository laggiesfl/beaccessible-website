import 'server-only';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

const organizationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  trustops: z.boolean(),
  grantflow: z.boolean(),
});
const organizationIdSchema = z.string().uuid();
const moduleIdSchema = z.enum(['trustops', 'grantflow']);
const emailSchema = z.string().trim().toLowerCase().email();

type AdminClient = ReturnType<typeof createAdminClient>;

type PlatformContext = {
  userId: string;
  admin: AdminClient;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function checked(formData: FormData, key: string): boolean {
  return formString(formData, key) === 'on';
}

async function requirePlatformAdmin(): Promise<PlatformContext> {
  const userClient = await createServerClient();
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;

  if (userError || !user?.id || user.app_metadata?.platform_role !== 'platform_admin') {
    redirect('/sign-in?error=platform-admin-required');
  }

  const admin = createAdminClient();
  const { data: active, error: authorityError } = await admin.rpc('verify_platform_admin', {
    target_user: user.id,
  });

  if (authorityError || active !== true) {
    redirect('/sign-in?error=platform-admin-required');
  }

  return { userId: user.id, admin };
}

function platformResult(code: string): never {
  redirect(`/app/admin/platform?result=${encodeURIComponent(code)}`);
}

export async function getPlatformAdminView() {
  const { admin } = await requirePlatformAdmin();
  const { data: organizations, error: organizationsError } = await admin
    .from('organizations')
    .select('id,name,status,created_at,suspended_at')
    .order('name');
  if (organizationsError) throw new Error('TrustOS could not load organisations');

  const { data: modules, error: modulesError } = await admin
    .from('organization_modules')
    .select('organization_id,module_id,status,enabled_at,disabled_at');
  if (modulesError) throw new Error('TrustOS could not load module licences');

  const moduleMap = new Map<string, Set<string>>();
  for (const module of modules ?? []) {
    if (module.status !== 'active') continue;
    const set = moduleMap.get(module.organization_id) ?? new Set<string>();
    set.add(module.module_id);
    moduleMap.set(module.organization_id, set);
  }

  return (organizations ?? []).map((organization) => ({
    ...organization,
    activeModules: [...(moduleMap.get(organization.id) ?? new Set<string>())],
  }));
}

export async function createOrganizationAction(formData: FormData) {
  'use server';
  const parsed = organizationSchema.safeParse({
    name: formString(formData, 'name'),
    trustops: checked(formData, 'trustops'),
    grantflow: checked(formData, 'grantflow'),
  });
  if (!parsed.success) platformResult('invalid-organization');

  const { userId, admin } = await requirePlatformAdmin();
  const { error } = await admin.rpc('trustos_platform_create_organization', {
    actor_user: userId,
    organization_name: parsed.data.name,
    enable_trustops: parsed.data.trustops,
    enable_grantflow: parsed.data.grantflow,
  });
  if (error) platformResult('organization-failed');

  revalidatePath('/app/admin/platform');
  platformResult('organization-created');
}

export async function setOrganizationModuleAction(formData: FormData) {
  'use server';
  const organizationId = organizationIdSchema.safeParse(formString(formData, 'organizationId'));
  const moduleId = moduleIdSchema.safeParse(formString(formData, 'moduleId'));
  const enabled = formString(formData, 'enabled');
  if (!organizationId.success || !moduleId.success || !['true', 'false'].includes(enabled)) {
    platformResult('module-invalid');
  }

  const { userId, admin } = await requirePlatformAdmin();
  const { error } = await admin.rpc('trustos_platform_set_module', {
    actor_user: userId,
    target_org: organizationId.data,
    target_module: moduleId.data,
    target_enabled: enabled === 'true',
  });
  if (error) platformResult('module-failed');

  revalidatePath('/app/admin/platform');
  platformResult('module-updated');
}

export async function inviteClientAdminAction(formData: FormData) {
  'use server';
  const organizationId = organizationIdSchema.safeParse(formString(formData, 'organizationId'));
  const email = emailSchema.safeParse(formString(formData, 'email'));
  if (!organizationId.success || !email.success) platformResult('invitation-invalid');

  const { userId, admin } = await requirePlatformAdmin();
  const { data: invitationId, error: invitationError } = await admin.rpc(
    'trustos_platform_create_client_admin_invitation',
    { actor_user: userId, target_org: organizationId.data, target_email: email.data },
  );
  if (invitationError || typeof invitationId !== 'string') platformResult('invitation-failed');

  const { TRUSTOS_APP_ORIGIN } = getServerEnv();
  const redirectTo = new URL('/api/auth/callback', TRUSTOS_APP_ORIGIN);
  redirectTo.searchParams.set('next', '/accept-invitation');
  redirectTo.searchParams.set('invitation', invitationId);

  const { error: deliveryError } = await admin.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: redirectTo.toString(),
  });

  if (deliveryError) {
    await admin.rpc('trustos_platform_cancel_invitation', {
      actor_user: userId,
      target_invitation: invitationId,
      cancellation_reason: 'delivery_failed',
    });
    platformResult('invitation-delivery-failed');
  }

  revalidatePath('/app/admin/platform');
  platformResult('invitation-sent');
}

export async function suspendOrganizationAction(formData: FormData) {
  'use server';
  const organizationId = organizationIdSchema.safeParse(formString(formData, 'organizationId'));
  if (!organizationId.success || !checked(formData, 'confirmSuspension')) {
    platformResult('suspension-not-confirmed');
  }

  const { userId, admin } = await requirePlatformAdmin();
  const { error } = await admin.rpc('trustos_platform_suspend_organization', {
    actor_user: userId,
    target_org: organizationId.data,
  });
  if (error) platformResult('suspension-failed');

  revalidatePath('/app/admin/platform');
  platformResult('organization-suspended');
}
