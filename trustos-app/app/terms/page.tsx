export default function TrustOSAccountTermsPage() {
  return (
    <article className="account-card" aria-labelledby="terms-heading">
      <h1 id="terms-heading">TrustOS Pilot Account Terms</h1>
      <p><strong>Version:</strong> terms-2026-08</p>
      <p>
        These pilot account terms describe the access rules for people invited to a TrustOS
        organisation during controlled Phase 2 testing.
      </p>

      <h2>Your account</h2>
      <p>
        Use your own TrustOS account and keep your sign-in credentials private. TrustOS access is
        determined by the organisation you belong to, the modules enabled for that organisation and
        the roles assigned to your account.
      </p>

      <h2>Permitted access</h2>
      <p>
        You may use only the organisations, TrustOps or GrantFlow modules and functions that are
        made available to your account. Attempted access outside those permissions is denied and
        important security events may be recorded.
      </p>

      <h2>Account and session security</h2>
      <p>
        Password changes, membership removal and serious security events may revoke active sessions.
        Access may also be suspended when the organisation or relevant module is inactive.
      </p>

      <h2>Administrative changes</h2>
      <p>
        BeAccessible controls platform-level administration. A client administrator may manage
        permitted team-member access only within their own organisation and only for modules enabled
        for that organisation.
      </p>

      <h2>Pilot status</h2>
      <p>
        TrustOS Phase 2 is being released through a controlled pilot. Pilot findings may require
        changes before broader production release. Security, privacy, accessibility and rollback
        release gates remain in force throughout the pilot.
      </p>
    </article>
  );
}
