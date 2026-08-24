export type ModuleRole =
  | 'module_admin'
  | 'contributor'
  | 'reviewer'
  | 'approver'
  | 'viewer';

export type ModuleAction = 'view' | 'edit' | 'review' | 'settings' | 'final_decision';

export type DenialReason =
  | 'no_session'
  | 'inactive_organization'
  | 'no_membership'
  | 'unlicensed_module'
  | 'no_module_role'
  | 'insufficient_role';

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: DenialReason };

export interface AccessContext {
  hasValidSession: boolean;
  organizationActive: boolean;
  membershipActive: boolean;
  moduleLicensed: boolean;
  moduleRoles: readonly ModuleRole[];
}

export interface AccessRequest {
  action: ModuleAction;
  context: AccessContext;
}
