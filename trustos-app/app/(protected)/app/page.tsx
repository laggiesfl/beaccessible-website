import Link from 'next/link';
import type { Metadata } from 'next';

import { ModuleShell } from '@/components/module-shell';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const moduleDefinitions = [
  { id: 'trustops' as const, name: 'TrustOps' },
  { id: 'grantflow' as const, name: 'GrantFlow' },
];

export default async function WorkspacePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPlatformAdmin = user?.app_metadata?.platform_role === 'platform_admin';

  const memberships = user?.id
    ? await supabase
        .from('organization_memberships')
        .select('organization_id,organization_role,status')
        .eq('user_id', user.id)
        .eq('status', 'active')
    : { data: [], error: null };
  const activeMembership = memberships.data?.[0] ?? null;
  const clientAdminMembership =
    !isPlatformAdmin && memberships.data?.find((membership) => membership.organization_role === 'client_admin');

  const moduleLicences = activeMembership
    ? await supabase
        .from('organization_modules')
        .select('module_id,status')
        .eq('organization_id', activeMembership.organization_id)
        .eq('status', 'active')
    : { data: [], error: null };

  const moduleRoles = activeMembership && user?.id
    ? await supabase
        .from('module_role_assignments')
        .select('module_id,role,status')
        .eq('organization_id', activeMembership.organization_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
    : { data: [], error: null };

  const availableModules = moduleDefinitions.filter((module) =>
    Boolean(moduleLicences.data?.some((item) => item.module_id === module.id)) &&
    Boolean(moduleRoles.data?.some((item) => item.module_id === module.id)),
  );

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

      <ModuleShell modules={availableModules} initialModule={availableModules[0]?.id} />

      {clientAdminMembership ? (
        <section className="workspace-admin" aria-labelledby="team-admin-heading">
          <h2 id="team-admin-heading">Team administration</h2>
          <p>Invite team members and manage roles for licensed TrustOS modules in your organisation.</p>
          <Link className="primary-button action-link" href="/app/admin/team">
            Open team administration
          </Link>
        </section>
      ) : null}

      {isPlatformAdmin ? (
        <section className="workspace-admin" aria-labelledby="platform-admin-heading">
          <h2 id="platform-admin-heading">Platform administration</h2>
          <p>Create client organisations, control module licences and invite client administrators.</p>
          <Link className="primary-button action-link" href="/app/admin/platform">
            Open platform administration
          </Link>
        </section>
      ) : null}

      {clientAdminMembership || isPlatformAdmin ? (
        <section className="workspace-admin" aria-labelledby="audit-heading">
          <h2 id="audit-heading">Access security audit</h2>
          <p>Review read-only access and security events available to your administrator role.</p>
          <Link className="secondary-button action-link" href="/app/audit">
            Open access security audit
          </Link>
        </section>
      ) : null}

      <aside className="status-message" aria-label="Pilot status">
        <strong>Phase 2 pilot status:</strong> access-controlled TrustOps and GrantFlow delivery is
        being verified before operational client data is introduced.
      </aside>
    </div>
  );
}
