export const E2E_PASSWORD = 'TrustOS-E2E-Accessible-2026!';
export const E2E_CURRENT_INVITEE_PASSWORD = 'TrustOS-E2E-Activated-2026-New!';
export const E2E_ACTIVATED_PASSWORD = 'TrustOS-E2E-Activated-2026-Final!';

export const E2E_USERS = {
  platformAdmin: { email: 'e2e-platform-admin@example.invalid', name: 'Fictional Platform Administrator' },
  clientA: { email: 'e2e-client-a@example.invalid', name: 'Fictional Client A Administrator' },
  clientB: { email: 'e2e-client-b@example.invalid', name: 'Fictional Client B Administrator' },
  invitee: { email: 'e2e-invitee@example.invalid', name: 'Fictional Invited Administrator' },
  viewer: { email: 'e2e-viewer@example.invalid', name: 'Fictional Viewer' },
  contributor: { email: 'e2e-contributor@example.invalid', name: 'Fictional Contributor' },
  reviewer: { email: 'e2e-reviewer@example.invalid', name: 'Fictional Reviewer' },
  approver: { email: 'e2e-approver@example.invalid', name: 'Fictional Approver' },
  moduleAdmin: { email: 'e2e-module-admin@example.invalid', name: 'Fictional Module Administrator' },
} as const;

export const E2E_IDS = {
  invitation: '30000000-0000-4000-8000-000000000001',
  clientAOrganization: '20000000-0000-4000-8000-000000000001',
  clientBOrganization: '20000000-0000-4000-8000-000000000002',
} as const;
