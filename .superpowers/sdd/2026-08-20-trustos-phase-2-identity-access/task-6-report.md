# Task 6 Report — Protected TrustOS Audit Trail

## Scope

Task 6 establishes immutable, privacy-minimised security audit recording for TrustOS Phase 2 while preserving the dedicated Supabase project boundary.

## Database implementation

Migration: `20260824184721_audit_append.sql`

The migration starts with the permanent TrustOS instance guard and therefore refuses to run unless the target database identifies itself as the dedicated TrustOS Supabase project `napjcycxzyrsruiifuca`.

### Write boundary

- `authenticated` cannot insert, update, delete or truncate `audit_events`.
- `service_role` cannot directly insert, update, delete or truncate `audit_events`.
- Only `service_role` can execute `public.append_trustos_audit_event(...)`.
- The public wrapper is `SECURITY INVOKER` and delegates to a narrowly granted private `SECURITY DEFINER` implementation.
- The privileged implementation remains in the non-exposed `private` schema with an empty search path.

### Audit-content boundary

Accepted audit event types are explicitly allowlisted and cover important account, invitation, organisation, module, membership, role, protected-access and retention events. Routine page views are not included.

Audit metadata is limited to these keys only:

- `source`
- `changed_fields`
- `retention_count`
- `user_agent_family`

The database rejects non-object metadata, non-allowlisted keys and metadata larger than 8 KiB. The application service independently applies the same restrictions before calling the database.

### Immutability

`private.protect_audit_event_mutation()` blocks update, delete and truncate operations. A future server-controlled retention operation may use the reserved private retention path; normal application roles cannot enable it.

## Hosted-database verification

All checks were run only against the dedicated TrustOS project `napjcycxzyrsruiifuca` and used rollback-only verification records.

### Privileges

Verified:

- service role can execute the append wrapper: yes
- authenticated user can execute append wrapper: no
- service-role direct insert: no
- service-role direct update: no
- service-role direct delete: no
- authenticated direct insert: no

### Valid append

A rollback-only `sign_in_failed` event was appended successfully with allowlisted metadata and read back with the expected event type, outcome, reason code and metadata.

### Metadata rejection

A rollback-only append using a non-allowlisted metadata key was rejected with `Audit metadata key is not allowed`.

### Tamper resistance

Rollback-only verification confirmed that direct update, delete and truncate attempts are rejected with `Audit events are immutable`. The verification event remained intact after the attempted mutations.

### Security Advisor

Supabase Security Advisor returned zero findings after the Task 6 migration.

### Contamination check

After verification:

- organisations: 0
- memberships: 0
- profiles: 0
- invitations: 0
- audit events: 0
- auth users: 0
- module catalogue: 2 canonical rows only

No fictional test users, organisations or audit events remain in the hosted TrustOS project.

## Application implementation

Created:

- `trustos-app/lib/audit/events.ts`
- `trustos-app/lib/errors.ts`
- `trustos-app/tests/audit/events.test.ts`
- `supabase/tests/audit_append.test.sql`

The application service:

- uses the server-only Supabase admin client;
- generates a request UUID when none is supplied;
- applies an explicit event allowlist;
- applies the audit metadata allowlist and 8 KiB size limit;
- never returns raw database errors to callers;
- fails closed with `Required audit event could not be stored` when required evidence cannot be written;
- uses approved plain-language authorization messages.

## Automated CI

Added `.github/workflows/trustos-app-verification.yml` to run:

1. `npm ci`
2. unit tests
3. TypeScript checks
4. production build

The workflow uses only non-secret CI placeholder values and pins the Supabase URL to the dedicated TrustOS project. The current GitHub connector has not surfaced a workflow-run result for the PR head, so no application-CI pass claim is made in this report.

## Task 6 status

- Hosted database controls and direct verification: **GREEN**.
- Supabase Security Advisor: **GREEN — zero findings**.
- Application implementation: **complete in branch, CI evidence pending visibility**.
- Production/client release: **still blocked** until later account, invitation, administration, protected-module, accessibility and deployed-browser gates are complete.
