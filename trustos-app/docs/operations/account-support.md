# TrustOS account support

## Scope

This procedure covers invitation, sign-in, password recovery, membership removal and access-escalation support for the controlled TrustOS Phase 2 rollout.

## Invitation support

If an invitation is expired, superseded or already used, do not alter its historical record. An authorised administrator may issue a replacement invitation through the supported TrustOS administration workflow. The replacement must use the intended organisation, organisation role and module roles.

Do not reuse an accepted invitation or manually edit invitation status to bypass the normal acceptance workflow.

## Password recovery

Direct the user to the TrustOS password-recovery page. The interface intentionally gives the same confirmation whether or not an email address exists, to avoid account enumeration.

Support staff must never ask for a user's password, recovery token, session token or one-time link. If recovery delivery fails, confirm the email address through authorised records and investigate transactional-email delivery without exposing authentication secrets.

## Membership removal

When access must end, use the supported team-administration removal or deactivation action. Removal must revoke active TrustOS sessions and prevent further organisation/module access while preserving required audit evidence.

Do not delete historical audit events as part of account removal.

## Unexpected access denial

Check, in order:

1. whether the user has a valid active session;
2. whether the organisation is active;
3. whether the organisation membership is active;
4. whether the requested module is licensed for the organisation;
5. whether the user has an active role for that module.

TrustOS is designed to fail closed when any of these conditions is missing.

## Escalation

Escalate unresolved account or accessibility issues to `hello@beaccessible.co.za`. Include the user's email address, organisation, affected task, approximate time and any visible error message. Do not include passwords, tokens, recovery links or secret environment values.

Security incidents should be escalated immediately and the relevant audit evidence preserved.
