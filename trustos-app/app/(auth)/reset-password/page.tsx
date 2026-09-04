import Link from 'next/link';
import type { Metadata } from 'next';

import { AccountForm } from '@/components/account-form';
import { ErrorSummary } from '@/components/error-summary';
import { PasswordField } from '@/components/password-field';
import { resetPasswordAction } from '@/lib/actions/auth';

export const metadata: Metadata = {
  title: 'Reset password',
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const errorMessage = params.error
    ? 'Choose a new password with at least 12 characters and try again.'
    : null;

  return (
    <section className="account-card" aria-labelledby="reset-password-heading">
      <h1 id="reset-password-heading">Create a new TrustOS password</h1>
      <p>
        Use a strong password you do not reuse elsewhere. You can paste a password or use a
        password manager.
      </p>

      <ErrorSummary message={errorMessage} />

      <AccountForm action={resetPasswordAction} submitLabel="Change password">
        <PasswordField
          id="new-password"
          name="password"
          label="New password"
          autoComplete="new-password"
          helpId="new-password-help"
          helpText="Use at least 12 characters. Pasted and password-manager passwords are supported."
        />
      </AccountForm>

      <p className="account-support-link">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </section>
  );
}
