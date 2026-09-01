# TrustOS Phase 2 rollback procedure

## Purpose

Use this procedure if a Phase 2 release is approved and later requires rollback. It is not an instruction to promote the current preview.

## Immediate containment

1. Stop new Phase 2 invitations and administrative changes that could increase exposure.
2. Preserve security audit events and existing evidence. Do not delete or rewrite audit history as part of rollback.
3. Record the affected deployment, time, observed symptom and operator in the incident record.

## Application rollback

Redeploy the last verified Phase 1 production commit or deployment that was active immediately before the Phase 2 promotion. Do not recreate the application from source fragments and do not point the production alias at an unverified preview.

Confirm after rollback:

- the production alias resolves to the intended Phase 1 deployment;
- TrustOps and GrantFlow legacy functionality remains available as expected;
- unauthenticated and authenticated access boundaries behave as they did before Phase 2;
- no Phase 2 preview URL has been promoted inadvertently.

## Identity and invitations

Disable or suspend Phase 2 invitation issuance while the incident is investigated. Existing accepted memberships may be deactivated when required, and active sessions may be revoked through the supported TrustOS session-revocation mechanism.

Do not delete invitation, membership, role or audit evidence merely to restore service.

## Database rollback boundary

Phase 2 migrations are additive security and identity changes. Do not reverse them destructively in production unless a separately reviewed migration explicitly proves that the rollback is safe. Prefer application rollback, invitation suspension and access revocation over dropping tables, functions or audit records.

Any database rollback must use a new tracked migration and must pass the migration contract, full pgTAP matrix and warning-level lint before application.

## Verification after rollback

Run the relevant application regression suite and confirm the known-good Phase 1 behavior. Review Supabase security advisors and deployment logs for residual Phase 2 errors.

Escalate unresolved access, privacy or accessibility incidents to `hello@beaccessible.co.za` with the affected task, timestamp and non-sensitive diagnostic details.
