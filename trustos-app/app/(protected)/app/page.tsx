import Link from 'next/link';

import { createServerClient } from '@/lib/supabase/server';

export default async function WorkspacePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPlatformAdmin = user?.app_metadata?.platform_role === 'platform_admin';

  return (
    <div className="page-content workspace-page">
      <header className="workspace-intro">
        <p className="eyebrow">BeAccessible TrustOS</p>
        <h1>Your TrustOS workspace</h1>
        <p>
          TrustOS brings TrustOps and GrantFlow into one controlled workspace. What you can use
          depends on your organisation&apos;s licence and your assigned role.
        </p>
        {user?.email ? <p className="signed-in-as">Signed in as {user.email}</p> : null}
      </header>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading">Modules</h2>
        <div className="workspace-grid">
          <article className="module-card">
            <p className="module-status">Access controlled</p>
            <h3>TrustOps</h3>
            <p>
              Governance, assurance and operational trust workflows. Access is enforced by your
              organisation licence and assigned TrustOS role.
            </p>
          </article>
          <article className="module-card">
            <p className="module-status">Access controlled</p>
            <h3>GrantFlow</h3>
            <p>
              Grant workflow and evidence-management capability. Access is enforced independently
              from TrustOps.
            </p>
          </article>
        </div>
      </section>

      {isPlatformAdmin ? (
        <section className="workspace-admin" aria-labelledby="platform-admin-heading">
          <h2 id="platform-admin-heading">Platform administration</h2>
          <p>Create client organisations, control module licences and invite client administrators.</p>
          <Link className="primary-button action-link" href="/app/admin/platform">
            Open platform administration
          </Link>
        </section>
      ) : null}

      <aside className="status-message" aria-label="Pilot status">
        <strong>Phase 2 pilot status:</strong> identity, access, invitation and platform-administration
        foundations are being verified before operational client data is introduced.
      </aside>
    </div>
  );
}
