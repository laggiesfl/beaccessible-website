import { moduleRoleAllows } from '@/lib/authz/permissions';
import { resolveAccess } from '@/lib/authz/resolver';
import type { AccessContext, AccessRequest, ModuleAction, ModuleRole } from '@/lib/authz/types';

const baseContext: AccessContext = {
  hasValidSession: true,
  organizationActive: true,
  membershipActive: true,
  moduleLicensed: true,
  moduleRoles: ['viewer'],
};

const request = (action: ModuleAction, context: Partial<AccessContext> = {}): AccessRequest => ({
  action,
  context: { ...baseContext, ...context },
});

test.each([
  ['viewer', 'view', true],
  ['viewer', 'edit', false],
  ['contributor', 'edit', true],
  ['contributor', 'final_decision', false],
  ['reviewer', 'review', true],
  ['module_admin', 'settings', true],
  ['module_admin', 'final_decision', false],
  ['approver', 'final_decision', true],
] as const)('%s / %s = %s', (role, action, allowed) => {
  expect(moduleRoleAllows(role as ModuleRole, action as ModuleAction)).toBe(allowed);
});

test.each([
  [{ hasValidSession: false }, 'no_session'],
  [{ organizationActive: false }, 'inactive_organization'],
  [{ membershipActive: false }, 'no_membership'],
  [{ moduleLicensed: false }, 'unlicensed_module'],
  [{ moduleRoles: [] }, 'no_module_role'],
] as const)('fails closed for %o', (context, reason) => {
  expect(resolveAccess(request('view', context))).toEqual({ allowed: false, reason });
});

test('denies a direct-link edit attempt when the assigned role cannot edit', () => {
  expect(resolveAccess(request('edit', { moduleRoles: ['viewer'] }))).toEqual({
    allowed: false,
    reason: 'insufficient_role',
  });
});

test('allows an action when any additive module role grants it', () => {
  expect(
    resolveAccess(
      request('final_decision', {
        moduleRoles: ['module_admin', 'approver'],
      }),
    ),
  ).toEqual({ allowed: true });
});

test('does not treat module administration as approval authority', () => {
  expect(resolveAccess(request('final_decision', { moduleRoles: ['module_admin'] }))).toEqual({
    allowed: false,
    reason: 'insufficient_role',
  });
});
