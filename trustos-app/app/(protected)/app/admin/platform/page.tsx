import {
  createOrganizationAction,
  getPlatformAdminView,
  inviteClientAdminAction,
  setOrganizationModuleAction,
  suspendOrganizationAction,
} from '@/lib/actions/platform-admin';

type PlatformAdminPageProps = {
  searchParams: Promise<{ result?: string }>;
};

const RESULT_MESSAGES: Record<string, string> = {
  'organization-created': 'Organisation created successfully.',
  'organization-failed': 'The organisation could not be created. No partial change was completed.',
  'invalid-organization': 'Enter a valid organisation name and try again.',
  'module-updated': 'Module access updated successfully.',
  'module-failed': 'The module change could not be completed.',
  'module-invalid': 'The requested module change is invalid.',
  'invitation-sent': 'Client administrator invitation sent successfully.',
  'invitation-failed': 'The invitation could not be created.',
  'invitation-invalid': 'Choose an organisation and enter a valid email address.',
  'invitation-delivery-failed': 'The invitation email could not be delivered. The unused invitation was cancelled.',
  'organization-suspended': 'Organisation suspended. Existing organisation access is now denied.',
  'suspension-failed': 'The organisation could not be suspended.',
  'suspension-not-confirmed': 'Confirm the suspension before submitting the request.',
};

function hasModule(activeModules: readonly string[], moduleId: string): boolean {
  return activeModules.includes(moduleId);
}

export default async function PlatformAdminPage({ searchParams }: PlatformAdminPageProps) {
  const params = await searchParams;
  const organizations = await getPlatformAdminView();
  const message = params.result ? RESULT_MESSAGES[params.result] : null;

  return (
    <main className="page-content" id="main-content">
      <header>
        <h1>BeAccessible TrustOS platform administration</h1>
        <p>
          Create client organisations, control TrustOps and GrantFlow licences, invite the first
          client administrator and suspend access when required.
        </p>
      </header>

      {message ? (
        <div className="status-message" role="status" aria-live="polite">
          {message}
        </div>
      ) : null}

      <section aria-labelledby="create-organization-heading" className="account-card admin-section">
        <h2 id="create-organization-heading">Create organisation</h2>
        <form action={createOrganizationAction} className="account-form">
          <div className="form-field">
            <label htmlFor="organization-name">Organisation name</label>
            <input id="organization-name" name="name" type="text" maxLength={200} required />
          </div>
          <fieldset>
            <legend>Modules to enable initially</legend>
            <label><input type="checkbox" name="trustops" /> TrustOps</label>
            <label><input type="checkbox" name="grantflow" /> GrantFlow</label>
          </fieldset>
          <button type="submit" className="primary-button">Create organisation</button>
        </form>
      </section>

      <section aria-labelledby="organizations-heading" className="admin-section">
        <h2 id="organizations-heading">Client organisations</h2>
        {organizations.length === 0 ? (
          <p>No client organisations have been created yet.</p>
        ) : (
          <div className="table-scroll" tabIndex={0} aria-label="Client organisation table">
            <table>
              <caption>TrustOS client organisations and module licences</caption>
              <thead>
                <tr>
                  <th scope="col">Organisation</th>
                  <th scope="col">Status</th>
                  <th scope="col">TrustOps</th>
                  <th scope="col">GrantFlow</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id}>
                    <th scope="row">{organization.name}</th>
                    <td>{organization.status === 'active' ? 'Active' : 'Suspended'}</td>
                    <td>{hasModule(organization.activeModules, 'trustops') ? 'Enabled' : 'Not enabled'}</td>
                    <td>{hasModule(organization.activeModules, 'grantflow') ? 'Enabled' : 'Not enabled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="licensing-heading" className="account-card admin-section">
        <h2 id="licensing-heading">Change module licensing</h2>
        <p>Only the selected organisation is changed. Module access still requires an individual module role.</p>
        {organizations.map((organization) => (
          <fieldset key={organization.id} disabled={organization.status !== 'active'}>
            <legend>{organization.name}</legend>
            {(['trustops', 'grantflow'] as const).map((moduleId) => {
              const enabled = hasModule(organization.activeModules, moduleId);
              const label = moduleId === 'trustops' ? 'TrustOps' : 'GrantFlow';
              return (
                <form action={setOrganizationModuleAction} key={moduleId} className="inline-admin-form">
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input type="hidden" name="moduleId" value={moduleId} />
                  <input type="hidden" name="enabled" value={enabled ? 'false' : 'true'} />
                  <span>{label}: {enabled ? 'Enabled' : 'Not enabled'}</span>
                  <button type="submit" className="secondary-button">
                    {enabled ? `Disable ${label}` : `Enable ${label}`}
                  </button>
                </form>
              );
            })}
          </fieldset>
        ))}
      </section>

      <section aria-labelledby="client-admin-heading" className="account-card admin-section">
        <h2 id="client-admin-heading">Invite first client administrator</h2>
        <form action={inviteClientAdminAction} className="account-form">
          <div className="form-field">
            <label htmlFor="client-admin-organization">Organisation</label>
            <select id="client-admin-organization" name="organizationId" required>
              <option value="">Choose an active organisation</option>
              {organizations.filter((organization) => organization.status === 'active').map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="client-admin-email">Client administrator email address</label>
            <input id="client-admin-email" name="email" type="email" inputMode="email" autoComplete="email" required />
          </div>
          <button type="submit" className="primary-button">Send client administrator invitation</button>
        </form>
      </section>

      <section aria-labelledby="suspension-heading" className="account-card admin-section">
        <h2 id="suspension-heading">Suspend organisation access</h2>
        <p>Suspension blocks active organisation access. It does not delete audit evidence.</p>
        {organizations.filter((organization) => organization.status === 'active').map((organization) => (
          <form action={suspendOrganizationAction} key={organization.id} className="account-form destructive-form">
            <input type="hidden" name="organizationId" value={organization.id} />
            <p><strong>{organization.name}</strong></p>
            <label>
              <input type="checkbox" name="confirmSuspension" required />{' '}
              I confirm that I want to suspend access for this organisation.
            </label>
            <button type="submit" className="secondary-button">Suspend {organization.name}</button>
          </form>
        ))}
      </section>
    </main>
  );
}
