export default function TrustOSPrivacyPage() {
  return (
    <article className="account-card" aria-labelledby="privacy-heading">
      <h1 id="privacy-heading">TrustOS Pilot Privacy Notice</h1>
      <p><strong>Version:</strong> privacy-2026-08</p>
      <p>
        This pilot notice explains the account and security information TrustOS uses to provide
        controlled access to TrustOps and GrantFlow during the pilot.
      </p>

      <h2>Information used for account access</h2>
      <p>
        TrustOS uses the minimum account information required for secure access, including your
        email address, display name, organisation membership, enabled modules, assigned roles,
        policy acknowledgements and security audit events. Passwords and authentication tokens are
        managed by Supabase Auth and are not stored in TrustOS application tables.
      </p>

      <h2>Information TrustOS does not require for access control</h2>
      <p>
        TrustOS does not require disability, diagnosis or assistive-technology information to
        decide whether you may access an organisation or module.
      </p>

      <h2>Security records</h2>
      <p>
        Important account, invitation, access and administrative events are recorded for security
        and accountability. Audit metadata is restricted and must not contain passwords, tokens,
        full form submissions or confidential operational records. Raw IP addresses are not stored
        by default.
      </p>

      <h2>Retention used for the pilot</h2>
      <ul>
        <li>Closed or expired invitations: 90 days.</li>
        <li>Repeated sign-in failure events: 90 days unless linked to an investigation.</li>
        <li>
          Membership, role, licence and administrative security events: while the organisation is
          active and for 24 months after termination.
        </li>
        <li>Legal or security holds: only for the documented hold period.</li>
      </ul>

      <h2>Account removal</h2>
      <p>
        Removing a team member deactivates their organisation access and revokes active sessions.
        Required historical security evidence remains protected and is not rewritten.
      </p>

      <p>
        This is the pilot notice used for TrustOS Phase 2 testing and controlled client rollout. It
        must be reviewed before broader production release.
      </p>
    </article>
  );
}
