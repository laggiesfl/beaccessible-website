import Link from 'next/link';

import { AccountForm } from '@/components/account-form';
import { ErrorSummary } from '@/components/error-summary';
import { PasswordField } from '@/components/password-field';
import { signInAction, safeNextPath } from '@/lib/actions/auth';

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    email?: string;
    next?: string;
    changed?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'session'
      ? 'Your session is no longer active. Sign in again to continue.'
      : params.error
        ? 'We could not sign you in. Check your details or reset your password.'
        : null;

  return (
    <section className="account-card" aria-labelledby="sign-in-heading">
      <h1 id="sign-in-heading">Sign in to TrustOS</h1>
      <p>Use the account details from your TrustOS invitation.</p>

      {params.changed === '1' ? (
        <p className="status-message" role="status">
          Your password has been changed. Sign in with your new password.
        </p>
      ) : null}

      <ErrorSummary message={errorMessage} />

      <AccountForm action={signInAction} submitLabel="Sign in">
        <input type="hidden" name="next" value={safeNextPath(params.next)} />
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={params.email ?? ''}
            required
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
        />
      </AccountForm>

      <p className="account-support-link">
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
    </section>
  );
}
