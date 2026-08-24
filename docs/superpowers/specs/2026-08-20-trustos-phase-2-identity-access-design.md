# TrustOS Phase 2: Shared Identity and Access Design

**Status:** Approved design; ready for specification review  
**Date:** 20 August 2026  
**Product:** TrustOS, comprising TrustOps Core and GrantFlow  
**Deployment:** Dedicated TrustOS application on Vercel  

## 1. Purpose

Phase 2 turns the Phase 1 consolidation demonstration into a secure multi-organisation product foundation. It adds real invited users, email-and-password sign-in, organisation-specific module licences, different roles per module, and protected security audit records.

The phase must preserve the working TrustOps and GrantFlow demonstrations. It does not migrate their operational project, grant, finance, payment or monitoring data into a shared live database. That migration requires a later design and implementation phase.

## 2. Approved product decisions

The approved decisions are:

- Phase 2 begins with shared sign-in and access control.
- Accounts are created for real invited users; there is no open public registration.
- TrustOS supports multiple client organisations with private, separated workspaces.
- BeAccessible creates each client organisation, enables its licensed modules and invites its first client administrator.
- A client administrator may invite people only into their own organisation.
- Sign-in uses email and password.
- A person may have different roles in TrustOps and GrantFlow.
- Important invitation, sign-in, permission and administrative events are recorded.
- The product uses Next.js on Vercel and Supabase for authentication and access-control records.
- Existing Phase 1 functionality and BeAccessible branding remain intact.

## 3. Scope

### 3.1 Included

- A dedicated Next.js TrustOS application deployed to Vercel.
- Supabase email-and-password authentication.
- Invitation, activation, sign-in, sign-out, password-recovery and account-removal journeys.
- BeAccessible platform administration for organisations, licences and initial client administrators.
- Client administration for team invitations and role assignments.
- Organisation membership and module-specific role enforcement.
- Server-side authorization and database Row Level Security (RLS).
- Protected, append-only security audit events.
- Accessible account and administration interfaces.
- Preservation of the Phase 1 TrustOps and GrantFlow behaviours and sample data.
- Automated, deployed-browser, accessibility, privacy and security verification.

### 3.2 Excluded

- Public self-registration.
- Social or passwordless sign-in.
- Billing and subscription collection.
- Automated AI decisions.
- Migration of operational module data into Supabase.
- Cross-organisation reporting.
- Automatic BeAccessible access to a client's operational module data.
- Custom client roles or a permission-rule editor.
- Multi-factor authentication in this phase. The architecture must leave room for it without weakening email-and-password security.

## 4. Architecture

### 4.1 Application boundary

The broader BeAccessible static website remains unchanged. The dedicated TrustOS deployment becomes a Next.js application in an isolated application directory within the existing repository. This avoids converting unrelated BeAccessible pages or changing their hosting behaviour.

The TrustOS application contains:

1. **Public account routes:** sign-in, invitation acceptance, password recovery and password reset.
2. **Protected shell:** organisation context, authorised modules, account help and sign-out.
3. **Protected administration:** BeAccessible platform administration, client team administration and organisation audit viewing.
4. **Protected legacy module routes:** server-authorized delivery of the existing TrustOps and GrantFlow interfaces.
5. **Server authorization layer:** resolves organisation membership, module licence, module role and permitted action for every protected request.
6. **Supabase:** Authentication, access-control records and audit records protected by RLS.

### 4.2 Preserving Phase 1 modules

The existing TrustOps and GrantFlow HTML, CSS and JavaScript move into the dedicated TrustOS application as legacy module assets without functional rewriting. Protected Next.js route handlers deliver each module only after a server authorization check. Module HTML must not be placed in an unrestricted public directory.

The Phase 1 shell behaviour is preserved:

- Only enabled modules appear.
- The selected module is clearly identified.
- Keyboard module switching remains available.
- Each module retains its in-browser state when the user moves between modules.
- A direct full-page module link receives the same server authorization check as the embedded version.
- Existing sample-only and manual-simulation disclosures remain visible.

The Phase 1 presentation-only `trustos-config.js` licence list is replaced by server-resolved organisation and role information. The browser never decides whether access is allowed.

### 4.3 Request flow

For every protected page, module and administrative action:

1. The Next.js server validates the Supabase session.
2. It identifies the active organisation from a server-validated route or session context.
3. It confirms that the organisation and membership are active.
4. For a module request, it confirms that the module is licensed to the organisation.
5. It confirms that the user's module role permits the requested action.
6. Supabase RLS independently restricts the underlying records.
7. Sensitive administrative actions and all denied attempts create security audit events.

Missing or contradictory information fails closed. Client-side hiding is an interface convenience, not a security control.

## 5. Roles and permissions

### 5.1 Organisation-level roles

| Role | Allowed | Not allowed automatically |
|---|---|---|
| BeAccessible platform administrator | Create or suspend organisations; enable modules; invite the first client administrator; view platform and access-security events | Read or change a client's operational TrustOps or GrantFlow data |
| Client administrator | Invite and remove team members in their organisation; assign module roles within licensed modules; view their organisation's access audit | Create another client administrator; enter another organisation; enable unlicensed modules; receive module data access without a module role |
| Team member | Use actions granted by their module role | Invite users, change organisation settings or use a module without a role |

Platform-administrator authority is written only by protected server administration to Supabase `app_metadata`, never to editable `user_metadata`. A server-only `private.platform_admins` record is the authoritative check for sensitive platform actions so revocation does not depend only on an existing session token.

### 5.2 Module roles

| Module role | View | Create or edit | Comment or score | Module settings | Final approve, decline or release |
|---|---:|---:|---:|---:|---:|
| Module administrator | Yes | Yes | Yes | Yes | No, unless also assigned Approver |
| Contributor | Yes | Yes | No | No | No |
| Reviewer | Yes | No | Yes | No | No |
| Approver | Yes | No | Yes | No | Yes |
| Viewer | Yes | No | No | No | No |

A person receives separate role assignments for each module. Assignments are additive within a module, so a module administrator who must also make final decisions receives an Approver assignment as well. No module role means deny. A person's TrustOps role does not grant any GrantFlow permission, and the reverse is also true.

## 6. Account journeys

### 6.1 Organisation setup and invitation

1. A BeAccessible platform administrator creates the organisation.
2. The administrator enables TrustOps, GrantFlow or both.
3. The administrator invites the first client administrator.
4. The client administrator may then invite team members only into that organisation and only for licensed modules. BeAccessible alone creates additional client-administrator accounts.

Invitations are single use and valid for 72 hours. Resending an invitation cancels the earlier application invitation before a new one is issued. The application records the invitation state but never stores an authentication token or password.

Supabase sends authentication email through BeAccessible's Resend SMTP configuration using `hello@beaccessible.co.za` as the account-support sender. Email credentials remain in protected server configuration.

### 6.2 Activation

The invited person:

1. Opens the secure invitation link.
2. Creates a password of at least 12 characters.
3. May paste a password, use a password manager and reveal or hide the entered password.
4. Acknowledges the current TrustOS privacy notice and account terms.
5. Receives the organisation and module assignments attached to the valid invitation.
6. Enters an accessible landing page showing only authorised modules.

Acceptance is transactional: membership and role assignments are either all created successfully or none are activated.

### 6.3 Sign-in and session safety

- Sign-in accepts email and password.
- Repeated failures receive progressive delays and create an audit event; there is no permanent automatic lockout.
- The application does not reveal whether an email address has an account.
- Sessions use secure, HTTP-only, same-site cookies and Supabase token rotation.
- Sessions expire after 60 minutes without activity and have a 12-hour maximum duration.
- Password changes, membership removal and serious security events revoke active sessions.
- Removing users, changing roles and other sensitive actions require a session authenticated within the previous 15 minutes; otherwise the administrator signs in again.

### 6.4 Password recovery

A recovery request always returns the same confirmation message. A valid account receives a single-use recovery link valid for 60 minutes. Successful password reset revokes existing sessions and records the event.

### 6.5 Account removal

Removing a team member immediately deactivates their organisation membership, invalidates module roles, revokes sessions and records the action. The person can no longer sign in to that organisation. Historical security events remain protected and are not rewritten.

## 7. Data design

All identifiers use UUIDs. Tables include creation and update timestamps where appropriate. Email comparison uses a normalized, case-insensitive value. Foreign keys prevent orphaned memberships, licences and role assignments.

| Record | Purpose | Essential fields |
|---|---|---|
| `private.platform_admins` | Authoritative server-only platform authority | `user_id`, `status`, `created_at`, `revoked_at` |
| `organizations` | One private client workspace | `id`, `name`, `status`, `created_at`, `suspended_at` |
| `profiles` | Minimal account display information | `user_id`, `display_name`, `created_at`, `updated_at` |
| `organization_memberships` | Connects a user to an organisation | `id`, `organization_id`, `user_id`, `organization_role`, `status`, `created_at`, `deactivated_at` |
| `module_catalog` | Fixed TrustOS and GrantFlow definitions | `id`, `name`, `status` |
| `organization_modules` | Organisation module licences | `organization_id`, `module_id`, `status`, `enabled_at`, `disabled_at` |
| `module_role_assignments` | Additive per-user, per-module roles | `id`, `organization_id`, `user_id`, `module_id`, `role`, `status`, `assigned_by`, `created_at`, `revoked_at` |
| `invitations` | Application invitation state | `id`, `organization_id`, `email_normalized`, `organization_role`, `invited_by`, `status`, `expires_at`, `accepted_at`, `superseded_at` |
| `invitation_module_roles` | Intended module roles on acceptance | `invitation_id`, `module_id`, `role` |
| `policy_acceptances` | Evidence of notice and terms acknowledgement | `id`, `user_id`, `organization_id`, `policy_type`, `policy_version`, `accepted_at` |
| `audit_events` | Immutable access-security evidence | `id`, `organization_id`, `actor_user_id`, `event_type`, `target_type`, `target_id`, `module_id`, `outcome`, `reason_code`, `request_id`, `metadata`, `occurred_at` |

The product does not collect disability, diagnosis or assistive-technology information for access control. Passwords and authentication tokens are managed only by Supabase Auth.

## 8. Database security

### 8.1 RLS and grants

- RLS is enabled on every table exposed through the Supabase Data API.
- Tables receive explicit grants; new tables are not assumed to be automatically exposed or protected.
- Anonymous users receive no table access.
- Authenticated users receive only the minimum operations required by the user journeys.
- Each tenant-scoped policy requires an active membership in the same organisation.
- Update policies include both existing-row and new-row checks.
- Role and licence policies deny by default.
- Authorization helper functions live in a non-public schema, use a fixed empty search path and expose only narrowly granted execution rights.
- Service-role credentials are used only in server-side administrative code and never sent to the browser.

### 8.2 Administrative boundaries

Platform administration operates through server-only actions that verify platform authority before using privileged database operations. Client administration operates within normal organisation-scoped RLS and cannot assign roles outside licensed modules.

Client administrators may read security events for their own organisation but cannot insert, update or delete them. The application server appends events through a restricted server operation. Platform-wide security events remain available only to BeAccessible platform administrators.

### 8.3 Audit content and privacy

Audit metadata is an allowlisted structure, not unrestricted free text. Events must never contain passwords, invitation tokens, recovery tokens, full form submissions or confidential operational records. Raw IP addresses are not stored by default.

Retention rules are:

- Closed or expired invitations: 90 days.
- Repeated sign-in failure events: 90 days unless linked to an investigation.
- Membership, role, licence and administrative security events: while the organisation is active and for 24 months after termination.
- Legal or security holds: retained only for the documented hold period and access-restricted.

Retention deletion runs as a server-controlled scheduled process and creates a summary audit event without copying deleted personal data.

## 9. Important audit events

TrustOS records:

- Invitation sent, resent, superseded, accepted or expired.
- Sign-in success, sign-in failure, password recovery, password changed and session revoked.
- Organisation created, activated, suspended or restored.
- Module enabled or disabled.
- Membership added, changed, deactivated or restored.
- Organisation or module role assigned, changed or revoked.
- Authorised entry to a protected module.
- Denied module or administrative access, including the reason code.
- Sensitive administrative actions and retention jobs.

Routine page views are not logged merely to create surveillance data.

## 10. Error handling

Critical authorization errors fail closed and preserve the current safe page. The interface uses an error summary, moves focus to it, links each message to the affected field, announces dynamic errors and preserves previously entered non-password information.

Approved user-facing messages include:

- **Incorrect sign-in:** “We could not sign you in. Check your details or reset your password.”
- **Expired invitation:** “This invitation has expired. Ask your client administrator to resend it.”
- **No module role:** “You are signed in, but no TrustOS module has been assigned to your account.”
- **Blocked module:** “You do not have permission to open this module. The attempt has been recorded.”
- **Temporary service failure:** “TrustOS is temporarily unavailable. Your request was not completed. Please try again.”

Database or authentication outages do not fall back to presentation-only access. Administrative mutations use idempotency or transaction boundaries so a retry cannot create duplicate invitations, memberships or roles.

## 11. Accessibility and Universal Design requirements

WCAG 2.2 Level AA is the release baseline. Level AAA measures are applied where feasible without making an unverified conformance claim.

Required measures include:

- Semantic landmarks, headings, lists, tables and buttons.
- A logical reading and focus order.
- Complete keyboard operation without traps.
- Highly visible focus indicators on light and dark surfaces.
- Visible labels and instructions for every form control.
- Error prevention, clear recovery and confirmation for destructive actions.
- Status and validation messages announced to assistive technologies.
- Text and interface contrast meeting or exceeding WCAG requirements.
- Reflow at 400% zoom without two-dimensional scrolling for normal content.
- Usable layouts at narrow mobile widths.
- Reduced-motion support and no required motion interaction.
- No information conveyed by colour alone.
- Support for browser password managers, pasted passwords and show-password controls.
- Large, well-spaced targets and low-effort paths for invitation, sign-in and administration.
- Plain-language content and meaningful links.
- No timeout without warning; a user receives a clear option to extend an active session before expiry.

Formal keyboard, screen-reader, zoom, reflow, high-contrast, reduced-motion and mobile testing is required. Production approval also requires testing of critical journeys with disabled users beyond the product owner where practical.

## 12. Security and privacy controls

- Dependencies and lockfiles are version-controlled and pinned.
- Supabase secrets and Resend SMTP credentials exist only in protected Vercel and Supabase settings.
- Content Security Policy, frame restrictions, referrer policy, transport security and other existing Vercel headers remain enforced and are adapted for Supabase connections.
- Production cookies use `Secure`, `HttpOnly` and an appropriate `SameSite` policy.
- Protected server actions validate input with shared schemas and do not trust browser-submitted roles or organisation identifiers.
- Administrative actions use explicit allowlists rather than inferred permission.
- Rate limits cover sign-in, recovery, invitation and privileged administrative actions.
- Logs redact credentials, tokens and client information.
- Privacy acknowledgement records the policy version and time.
- Backups, restoration and rollback are documented and tested before the client pilot.

## 13. Verification

### 13.1 Automated verification

- Existing Phase 1 regression tests continue to pass.
- Unit tests cover the authorization decision resolver and each role capability.
- Integration tests cover invitation acceptance, role assignment, membership removal and session revocation.
- RLS tests use at least two organisations and prove cross-organisation denial for every tenant-scoped table.
- Tests cover unlicensed modules, missing roles, inactive organisations, inactive memberships and direct protected-route access.
- Audit tests prove required events are created and cannot be altered through the application.
- Accessibility tests cover document structure, labels, focus visibility, contrast, error associations and reduced motion.
- Security tests prove no service credential or sensitive record appears in browser code or responses.

### 13.2 Deployed-browser verification

Every release candidate is checked on its Vercel preview URL. Verification covers keyboard operation, responsive layouts, persisted module state, direct-link denial, invitations, recovery, administration and browser-console errors. Local browser skips do not count as production evidence.

### 13.3 Release-stop conditions

Any of the following blocks release until corrected and retested:

- Cross-organisation data exposure.
- Privilege escalation or a direct-link bypass.
- An exposed secret or token.
- A missing required security event.
- An inaccessible critical account or administration task.
- Regression in existing TrustOps or GrantFlow behaviour.
- An unreviewed database security-advisor warning affecting the Phase 2 schema.

## 14. Rollout

1. **Build preview:** fictional organisations and users only.
2. **BeAccessible review:** all roles, licence combinations, errors, accessibility journeys and administrative actions.
3. **Small client pilot:** one or two approved organisations, with monitoring and a documented support route.
4. **Production release:** only after pilot findings are resolved, database and security checks pass, privacy information is published and rollback is ready.

The current production Phase 1 demonstration remains available while Phase 2 is built and tested on Vercel previews. Phase 2 replaces the production deployment only after explicit release approval.

## 15. Completion criteria

Phase 2 is complete when:

- Real invited users can activate, sign in, sign out and recover accounts.
- BeAccessible can create organisations, enable modules and invite client administrators.
- Client administrators can invite and remove their team and assign permitted roles.
- TrustOps and GrantFlow access follows both the organisation licence and the user's module role.
- Client organisations cannot access one another's identity, role, invitation or security records.
- Important access events appear in a protected audit record.
- Account removal immediately revokes access while retaining required audit evidence.
- Existing Phase 1 functionality remains operational.
- Accessibility, security, privacy, database-policy and rollback checks have documented evidence.
- The dedicated Vercel deployment passes deployed-browser verification.

## Accessibility Compliance Note

This specification applies WCAG 2.2 Level AA as the release baseline, with Level AAA measures included where feasible. It incorporates semantic structure, keyboard access, visible focus, strong contrast, responsive reflow, reduced-motion support, accessible authentication, clear errors, timeout warnings, low-effort interaction and assistive-technology testing. Formal conformance cannot be claimed until the implemented product has completed automated, manual and user testing; any remaining limitations must be documented in the TrustOS accessibility statement.
