import Link from 'next/link';

import { AccountForm } from '@/components/account-form';
import { ErrorSummary } from '@/components/error-summary';
import { PasswordField } from '@/components/password-field';
import {
  acceptInvitationAction,
  getInvitationPreview,
} from '@/lib/actions/invitations';

type AcceptInvitationPageProps = {
  searchParams: Promise<{ invitation?: string; error?: string }>;
};

function roleLabel(role: 'client_admin' | 'team_member'): string {
  return role === 'client_admin' ? 'Client administrator' : 'Team member';
}

function moduleRoleLabel(role: string): string {
  return role.replaceAll('_', ' ');
}

function activationError(code?: string): string | null {
  if (!code) return null;
  if (code === 'validation') {
    return 'Complete all required fields, use a password of at least 12 characters and acknowledge both pilot policies.';
  }
  if (code === 'password') {
    return 'Your password could not be updated. Please choose a different password and try again.';
  }
  return 'This invitation cannot be activated. It may be expired, already used or no longer valid.';
}

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams;
  const preview = await getInvitationPreview(params.invitation);

  if (!preview) {
    return (
      <section className="account-card" aria-labelledby="invitation-unavailable-heading">
        <h1 id="invitation-unavailable-heading">TrustOS invitation unavailable</h1>
        <div className="error-summary" role="alert">
          <p>
            This invitation cannot be opened with your current signed-in account. It may have
            expired, been replaced or been issued to a different email address.
          </p>
        </div>
        <p>
          <Link href="/sign-in">Return to sign in</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="account-card" aria-labelledby="activate-account-heading">
      <h1 id="activate-account-heading">Activate your TrustOS account</h1>
      <p>
        Review the access prepared for you, create your password and acknowledge the pilot privacy
        notice and account terms.
      </p>

      <dl>
        <div>
          <dt>Organisation</dt>
          <dd>{preview.organizationName}</dd>
        </div>
        <div>
          <dt>Organisation role</dt>
          <dd>{roleLabel(preview.organizationRole)}</dd>
        </div>
      </dl>

      <h2>Modules assigned</h2>
      {preview.modules.length ? (
        <ul>
          {preview.modules.map((module) => (
            <li key={`${module.id}-${module.role}`}>
              {module.name}: {moduleRoleLabel(module.role)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No module role has been assigned yet. Activation can continue, but module access will remain unavailable until a role is assigned.</p>
      )}

      <ErrorSummary message={activationError(params.error)} />

      <AccountForm action={acceptInvitationAction} submitLabel="Activate my TrustOS account">
        <input type="hidden" name="invitationId" value={preview.invitationId} />

        <div className="form-field">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            minLength={1}
            maxLength={100}
            required
          />
        </div>

        <PasswordField
          id="activation-password"
          name="password"
          label="Create password"
          autoComplete="new-password"
          helpId="activation-password-help"
          helpText="Use at least 12 characters. You can paste a password or use a password manager."
        />

        <div className="form-field policy-field">
          <label>
            <input type="checkbox" name="privacyAccepted" required />{' '}
            I have read and acknowledge the{' '}
            <Link href="/privacy">TrustOS Pilot Privacy Notice</Link>.
          </label>
        </div>

        <div className="form-field policy-field">
          <label>
            <input type="checkbox" name="termsAccepted" required />{' '}
            I have read and accept the{' '}
            <Link href="/terms">TrustOS Pilot Account Terms</Link>.
          </label>
        </div>
      </AccountForm>
    </section>
  );
}
