import { moduleRoleAllows } from '@/lib/authz/permissions';
import type { AccessDecision, AccessRequest } from '@/lib/authz/types';

export function resolveAccess({ action, context }: AccessRequest): AccessDecision {
  if (!context.hasValidSession) {
    return { allowed: false, reason: 'no_session' };
  }

  if (!context.organizationActive) {
    return { allowed: false, reason: 'inactive_organization' };
  }

  if (!context.membershipActive) {
    return { allowed: false, reason: 'no_membership' };
  }

  if (!context.moduleLicensed) {
    return { allowed: false, reason: 'unlicensed_module' };
  }

  if (context.moduleRoles.length === 0) {
    return { allowed: false, reason: 'no_module_role' };
  }

  if (!context.moduleRoles.some((role) => moduleRoleAllows(role, action))) {
    return { allowed: false, reason: 'insufficient_role' };
  }

  return { allowed: true };
}
