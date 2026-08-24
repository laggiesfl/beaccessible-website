import Link from 'next/link';

import { AccountForm } from '@/components/account-form';
import {
  RECOVERY_CONFIRMATION,
  requestRecoveryAction,
} from '@/lib/actions/auth';

type ForgotPasswordPageProps = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="account-card" aria-labelledby="forgot-password-heading">
      <h1 id="forgot-password-heading">Reset your TrustOS password</h1>
      <p>
        Enter the email address used for your TrustOS account. We will send recovery
        instructions if an account matches it.
      </p>

      {params.sent === '1' ? (
        <p className="status-message" role="status" aria-live="polite">
          {RECOVERY_CONFIRMATION}
        </p>
      ) : null}

      <AccountForm action={requestRecoveryAction} submitLabel="Send recovery instructions">
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
          />
        </div>
      </AccountForm>

      <p className="account-support-link">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </section>
  );
}
