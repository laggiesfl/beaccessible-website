# Task 4 Report — TrustOS Tenant Isolation and Supabase Boundary Guardrails

## Scope

Task 4 establishes database-enforced organisation separation and strict project boundaries for TrustOS Phase 2. TrustOS must not share its identity/access schema with the existing BeAccessible Supabase project or BiasLens resources.

## Dedicated production boundary

- Dedicated Supabase project: `TrustOS`
- Approved project ref: `napjcycxzyrsruiifuca`
- Region: `eu-west-2`
- Shared BeAccessible project `uuvxqyrqhqktkeovkivx` was not modified for TrustOS.
- Hosted TrustOS runtime configuration rejects every Supabase hostname except `napjcycxzyrsruiifuca.supabase.co`.
- Localhost Supabase is permitted only for non-production development/test use.

## Database fail-closed safeguards

1. The initial TrustOS migration refuses to install into a database that already contains public application tables.
2. `private.instance_identity` records `product = 'trustos'` and the approved project ref.
3. `private.assert_trustos_instance()` is executable only by `postgres` and is unavailable to `public`, `anon`, `authenticated`, and `service_role`.
4. The migration contract requires every migration created after the permanent guard to start with `select private.assert_trustos_instance();`.
5. Automatic default table/function/sequence privileges are revoked before TrustOS application tables are created.
6. Anonymous table access remains revoked.
7. Signed-in access is opt-in and constrained by explicit grants plus RLS.
8. Server-only session revocation uses a narrow public security-invoker wrapper; the privileged implementation remains in the private schema.

## Tenant-isolation implementation

RLS is enabled for:

- `organizations`
- `profiles`
- `module_catalog`
- `organization_memberships`
- `organization_modules`
- `module_role_assignments`
- `invitations`
- `invitation_module_roles`
- `policy_acceptances`
- `audit_events`

Policies enforce active-session, active-organisation, membership, client-admin and active-module conditions as appropriate. Ordinary signed-in users cannot write audit records directly or access `private.platform_admins`.

## Verification evidence

### Two-organisation isolation

A transaction-only Client A / Client B test confirmed that Client A could see only `Fictional Client A`. Client B profile, membership, invitation, role-assignment and audit visibility counts were all zero. A cross-organisation role update changed zero rows. Authenticated users had no direct `audit_events` insert privilege.

### Ordinary team member

A team member could see only their own profile, zero invitations and zero audit records, while retaining access to their own organisation.

### Session revocation

The service-only revocation wrapper removed the test session. Reusing the same JWT claim context immediately returned zero visible organisations, proving the database does not rely solely on token expiry.

### Client-admin role assignment regression

Review found that the first `is_active_member` implementation incorrectly checked the target team member as the session owner. A RED test reproduced the RLS denial for a legitimate same-organisation assignment. Migration `20260824184038_fix_active_member_actor_session.sql` corrected the helper to validate the current actor's session while checking the target user's membership. The GREEN retest returned exactly one permitted same-organisation role assignment.

### Security advisor

Supabase security advisors returned zero lints after the isolation and corrective migrations.

### Test-data contamination check

After all verification transactions:

- organisations: 0
- memberships: 0
- profiles: 0
- invitations: 0
- audit events: 0
- auth users: 0
- module catalogue: 2 canonical rows (`trustops`, `grantflow`)

No fictional verification identities or client data remain in the dedicated TrustOS project.

## Migration-history reconciliation

The remote migration API initially recorded application-time timestamps for two migrations. Migration tracking was repaired transactionally, after an exact-version precondition check, without altering schema or client data. Current remote history now matches GitHub:

1. `20260824061656_identity_access_schema`
2. `20260824183133_identity_access_rls`
3. `20260824183458_trustos_instance_guard`
4. `20260824184038_fix_active_member_actor_session`

## Automated regression protection

- RLS pgTAP matrix expanded to 31 assertions.
- It includes cross-organisation reads, cross-organisation role mutation denial, ordinary-member visibility, service-only revocation, immediate revoked-session denial and legitimate client-admin role assignment.
- GitHub database verification now runs the migration-boundary contract, full database test suite and database lint in a disposable local Supabase environment.
- The GitHub connector did not surface a workflow-run result for the current PR head, so no CI-pass claim is made here. Production transaction tests and Supabase security-advisor checks are independently GREEN.

## Task 4 status

Implementation and hosted-database verification: **GREEN**.

Release remains blocked until the later Phase 2 account, invitation, audit-service, protected-module, accessibility, browser and Vercel-preview gates are also complete.
