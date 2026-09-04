import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy notice',
};

export default function TrustOSPrivacyPage() {
  return (
    <article className="account-card" aria-labelledby="privacy-heading">
      <h1 id="privacy-heading">TrustOS Pilot Privacy Notice</h1>
      <p><strong>Version:</strong> privacy-2026-09</p>
      <p>
        This notice explains how BeAccessible uses account and security information to provide
        controlled access to TrustOps and GrantFlow during the TrustOS pilot.
      </p>

      <h2>Information used for account access</h2>
      <p>
        TrustOS uses the minimum account information required for secure access, including your
        email address, display name, organisation membership, enabled modules, assigned roles,
        policy acknowledgements, session-security records and security audit events. Passwords and
        authentication tokens are managed by Supabase Auth and are not stored in TrustOS
        application tables.
      </p>

      <h2>Purpose</h2>
      <p>
        This information is used to authenticate users, enforce organisation and module access,
        administer invitations and roles, recover accounts, detect or investigate security events,
        maintain an accountable audit trail and support the controlled TrustOS pilot.
      </p>

      <h2>Information TrustOS does not require for access control</h2>
      <p>
        TrustOS does not require disability, diagnosis or assistive-technology information to
        decide whether you may access an organisation or module.
      </p>

      <h2>Who may receive account information</h2>
      <p>
        Access is limited to authorised BeAccessible administrators and service providers needed
        to operate the pilot. Supabase provides authentication and database services, Vercel hosts
        the TrustOS application, and the configured transactional-email service may process the
        email address needed to deliver invitations or recovery messages. Access is limited to the
        operational purpose for which the information is required.
      </p>

      <h2>Security records</h2>
      <p>
        Important account, invitation, access and administrative events are recorded for security
        and accountability. Audit metadata is restricted and must not contain passwords, tokens,
        full form submissions or confidential operational records. Raw IP addresses are not stored
        by default in TrustOS application audit tables.
      </p>

      <h2>Retention used for the pilot</h2>
      <ul>
        <li>Closed, accepted, superseded or expired invitation records: 90 days where eligible for scheduled cleanup.</li>
        <li>Repeated sign-in failure events: 90 days unless linked to an investigation or hold.</li>
        <li>
          Membership, role, licence and administrative security evidence: while the organisation
          is active and for up to 24 months after termination where required for accountability.
        </li>
        <li>Legal or security holds: only for the documented hold period.</li>
      </ul>

      <h2>Your privacy rights</h2>
      <p>
        Subject to applicable law, including POPIA, you may ask whether BeAccessible holds personal
        information about you, request access to it, ask for inaccurate information to be corrected,
        request deletion where retention is no longer lawful or necessary, or object to processing
        where the law gives you that right. Some security and audit evidence may need to be retained
        where there is a lawful accountability, contractual, security or legal requirement.
      </p>

      <h2>Account removal</h2>
      <p>
        Removing a team member deactivates their organisation access and revokes active sessions.
        Required historical security evidence remains protected and is not rewritten merely because
        access has ended.
      </p>

      <h2>Questions and complaints</h2>
      <p>
        Contact BeAccessible at{' '}
        <a href="mailto:hello@beaccessible.co.za">hello@beaccessible.co.za</a> for access,
        correction, deletion, objection or privacy questions. You may also lodge a complaint with
        the Information Regulator of South Africa where applicable.
      </p>

      <p>
        This notice applies to the controlled TrustOS Phase 2 pilot. It will be reviewed before any
        broader production release.
      </p>
    </article>
  );
}
