import { expect, test } from '@playwright/test';

import { signInFixture } from './helpers/supabase-fixtures';
import { E2E_USERS } from './helpers/test-users';

for (const roleUser of [
  E2E_USERS.viewer,
  E2E_USERS.contributor,
  E2E_USERS.reviewer,
  E2E_USERS.approver,
  E2E_USERS.moduleAdmin,
]) {
  test(`${roleUser.name} can enter TrustOps but not roleless GrantFlow`, async ({ page }) => {
    await signInFixture(page, roleUser.email);

    const allowed = await page.request.get('/app/modules/trustops');
    expect(allowed.status()).toBe(200);

    const denied = await page.request.get('/app/modules/grantflow');
    expect(denied.status()).toBe(403);
    expect(await denied.text()).toContain('Access denied');
  });
}

test('licensed client administrator keeps both module frames mounted while switching', async ({ page }) => {
  await signInFixture(page, E2E_USERS.clientA.email);
  const frames = page.locator('iframe.module-frame');
  await expect(frames).toHaveCount(2);
  await page.getByRole('button', { name: 'GrantFlow' }).click();
  await expect(page.getByText('GrantFlow selected.')).toBeVisible();
  await expect(frames).toHaveCount(2);
});
