import 'server-only';

import { resolveAccess } from '@/lib/authz/resolver';
import type { ModuleRole } from '@/lib/authz/types';
import { createServerClient } from '@/lib/supabase/server';

export type TrustOSModuleId = 'trustops' | 'grantflow';

export type ModuleRequestAccess = {
  allowed: boolean;
  reason?: string;
  actorUserId: string | null;
  organizationId: string | null;
};

const MODULE_ROLES = new Set<ModuleRole>([
  'module_admin',
  'contributor',
  'reviewer',
  'approver',
  'viewer',
]);

function isModuleRole(value: unknown): value is ModuleRole {
  return typeof value === 'string' && MODULE_ROLES.has(value as ModuleRole);
}

export async function resolveModuleRequestAccess(moduleId: TrustOSModuleId): Promise<ModuleRequestAccess> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: 'no_session', actorUserId: null, organizationId: null };
  }

  const memberships = await supabase
    .from('organization_memberships')
    .select('organization_id,status')
    .eq('user_id', user.id)
    .eq('status', 'active');
  const membership = memberships.data?.[0] ?? null;

  if (!membership) {
    return { allowed: false, reason: 'no_membership', actorUserId: user.id, organizationId: null };
  }

  const [organization, licences, assignments] = await Promise.all([
    supabase.from('organizations').select('status').eq('id', membership.organization_id).limit(1),
    supabase.from('organization_modules').select('module_id,status').eq('organization_id', membership.organization_id).eq('module_id', moduleId),
    supabase.from('module_role_assignments').select('role,status').eq('organization_id', membership.organization_id).eq('user_id', user.id).eq('module_id', moduleId).eq('status', 'active'),
  ]);

  const roles = (assignments.data ?? []).map((item) => item.role).filter(isModuleRole);
  const decision = resolveAccess({
    action: 'view',
    context: {
      hasValidSession: true,
      organizationActive: organization.data?.[0]?.status === 'active',
      membershipActive: membership.status === 'active',
      moduleLicensed: Boolean(licences.data?.some((item) => item.status === 'active')),
      moduleRoles: roles,
    },
  });

  return {
    ...decision,
    actorUserId: user.id,
    organizationId: membership.organization_id,
  };
}
