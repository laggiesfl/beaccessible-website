import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { E2E_PASSWORD } from './test-users';

function loadFixtureSecret() {
  if (process.env.E2E_FIXTURE_SECRET) return process.env.E2E_FIXTURE_SECRET;
  const envPath = resolve(process.cwd(), '.env.e2e.local');
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith('E2E_FIXTURE_SECRET='));
  if (!line) throw new Error('E2E_FIXTURE_SECRET is required for staged E2E fixture reset.');
  return line.slice('E2E_FIXTURE_SECRET='.length).trim();
}

export async function resetE2EFixtures(request: APIRequestContext) {
  const response = await request.post('/api/test/e2e-reset', {
    headers: { Authorization: `Bearer ${loadFixtureSecret()}` },
  });
  if (!response.ok()) throw new Error(`E2E fixture reset failed with HTTP ${response.status()}.`);
}

export async function signInFixture(page: Page, email: string, password = E2E_PASSWORD) {
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/app(?:[/?#]|$)/, { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: /TrustOS workspace/i })).toBeVisible();
}

export async function signOutFixture(page: Page) {
  const button = page.getByRole('button', { name: 'Sign out' });
  if (await button.count()) {
    await button.click();
    await page.waitForURL(/\/sign-in(?:[/?#]|$)/, { waitUntil: 'commit' });
    return;
  }

  const response = await page.request.post('/api/session/sign-out');
  if (!response.ok()) throw new Error(`Sign out failed with HTTP ${response.status()}`);
  await page.goto('/sign-in');
}
