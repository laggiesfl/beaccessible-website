import { expect, test } from '@playwright/test';

import { signInFixture } from './helpers/supabase-fixtures';
import { E2E_USERS } from './helpers/test-users';

const CLIENT_A = 'Fictional E2E Client A';
const CLIENT_B = 'Fictional E2E Client B';

test('Client A administrator cannot see Client B team or audit data', async ({ page }) => {
  await signInFixture(page, E2E_USERS.clientA.email);

  await page.goto('/app/admin/team');
  await expect(page.locator('body')).toContainText(CLIENT_A);
  await expect(page.locator('body')).not.toContainText(CLIENT_B);
  await expect(page.locator('body')).not.toContainText(E2E_USERS.clientB.email);

  await page.goto('/app/audit');
  await expect(page.getByRole('heading', { name: /audit/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(CLIENT_B);
  await expect(page.locator('body')).not.toContainText(E2E_USERS.clientB.email);
});

test('Client B administrator cannot see Client A team data', async ({ page }) => {
  await signInFixture(page, E2E_USERS.clientB.email);
  await page.goto('/app/admin/team');
  await expect(page.locator('body')).toContainText(CLIENT_B);
  await expect(page.locator('body')).not.toContainText(CLIENT_A);
  await expect(page.locator('body')).not.toContainText(E2E_USERS.clientA.email);
});
