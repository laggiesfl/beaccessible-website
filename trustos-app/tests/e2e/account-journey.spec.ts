import { expect, test } from '@playwright/test';

import { resetE2EFixtures, signInFixture, signOutFixture } from './helpers/supabase-fixtures';
import { E2E_ACTIVATED_PASSWORD, E2E_IDS, E2E_USERS } from './helpers/test-users';

test.describe.serial('account lifecycle', () => {
  test.beforeAll(async ({ request }) => {
    await resetE2EFixtures(request);
  });

  test('invitation activation and activated-account continuity are verified', async ({ page }) => {
    await signInFixture(page, E2E_USERS.invitee.email);
    await page.goto(`/accept-invitation?invitation=${E2E_IDS.invitation}`);
    await expect(page.getByRole('heading', { name: 'Activate your TrustOS account' })).toBeVisible();
    await page.getByLabel('Display name').fill(E2E_USERS.invitee.name);
    await page.getByLabel('Create password').fill(E2E_ACTIVATED_PASSWORD);
    await page.getByLabel(/privacy notice/i).check();
    await page.getByLabel(/account terms/i).check();
    await page.getByRole('button', { name: 'Activate my TrustOS account' }).click();
    await expect(page.getByRole('heading', { name: /TrustOS workspace/i })).toBeVisible();
    await signOutFixture(page);
    await signInFixture(page, E2E_USERS.invitee.email, E2E_ACTIVATED_PASSWORD);
    await signOutFixture(page);
  });

  test('active client administrator can sign in and sign out', async ({ page }) => {
    await signInFixture(page, E2E_USERS.clientA.email);
    await signOutFixture(page);
    await expect(page.getByRole('heading', { name: 'Sign in to TrustOS' })).toBeVisible();
  });

  test('a used invitation cannot be activated a second time', async ({ page }) => {
    await signInFixture(page, E2E_USERS.invitee.email, E2E_ACTIVATED_PASSWORD);
    await page.goto(`/accept-invitation?invitation=${E2E_IDS.invitation}`);
    await expect(page.getByRole('heading', { name: 'TrustOS invitation unavailable' })).toBeVisible();
  });

  test('password recovery gives a generic confirmation for an unknown address', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email address').fill('unknown-e2e-user@example.invalid');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText(
      'If an account matches that email address, a password-recovery message has been sent.',
    )).toBeVisible();
  });
});
