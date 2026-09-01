import { render, screen } from '@testing-library/react';

import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';
import SignInPage from '@/app/(auth)/sign-in/page';

test('sign-in exposes labels, password-manager hints and a focused announced error summary', async () => {
  render(await SignInPage({ searchParams: Promise.resolve({ error: 'invalid' }) }));

  expect(screen.getByLabelText('Email address')).toHaveAttribute('autocomplete', 'email');
  expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  expect(screen.getByRole('alert')).toHaveTextContent('We could not sign you in');
  expect(screen.getByRole('alert')).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'false');
});

test('sign-in preserves non-password email input after validation failure', async () => {
  render(
    await SignInPage({
      searchParams: Promise.resolve({ error: 'invalid', email: 'person@example.org' }),
    }),
  );

  expect(screen.getByLabelText('Email address')).toHaveValue('person@example.org');
  expect(screen.getByLabelText('Password')).toHaveValue('');
});

test('recovery uses a non-disclosing confirmation and labelled email field', async () => {
  render(
    await ForgotPasswordPage({
      searchParams: Promise.resolve({ sent: '1' }),
    }),
  );

  expect(screen.getByLabelText('Email address')).toHaveAttribute('autocomplete', 'email');
  expect(screen.getByRole('status')).toHaveTextContent(
    'If an account matches that email address, a password-recovery message has been sent.',
  );
});

test('reset-password supports password managers and describes the minimum length', async () => {
  render(await ResetPasswordPage({ searchParams: Promise.resolve({}) }));

  const password = screen.getByLabelText('New password');
  expect(password).toHaveAttribute('autocomplete', 'new-password');
  expect(password).toHaveAttribute('aria-describedby', 'new-password-help');
  expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
});
