import type { ModuleAction, ModuleRole } from '@/lib/authz/types';

export const ROLE_ACTIONS: Readonly<Record<ModuleRole, readonly ModuleAction[]>> = {
  module_admin: ['view', 'edit', 'review', 'settings'],
  contributor: ['view', 'edit'],
  reviewer: ['view', 'review'],
  approver: ['view', 'review', 'final_decision'],
  viewer: ['view'],
};

export function moduleRoleAllows(role: ModuleRole, action: ModuleAction): boolean {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}
