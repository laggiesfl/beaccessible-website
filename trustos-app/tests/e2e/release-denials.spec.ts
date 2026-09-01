import { expect, test } from '@playwright/test';

import { resetE2EFixtures, signInFixture } from './helpers/supabase-fixtures';
import { E2E_USERS } from './helpers/test-users';

test.afterEach(async ({ request }) => {
  await resetE2EFixtures(request);
});

test('unlicensed GrantFlow is denied to an otherwise active Client B administrator', async ({ page, request }) => {
  await resetE2EFixtures(request);
  await signInFixture(page, E2E_USERS.clientB.email);
  await resetE2EFixtures(request, 'client_b_unlicensed');
  const response = await page.request.get('/app/modules/grantflow');
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain('Access denied');
});

test('a suspended organisation cannot enter TrustOps', async ({ page, request }) => {
  await resetE2EFixtures(request);
  await signInFixture(page, E2E_USERS.clientB.email);
  await resetE2EFixtures(request, 'client_b_suspended');
  const response = await page.request.get('/app/modules/trustops');
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain('Access denied');
});

test('a removed membership cannot enter a protected module', async ({ page, request }) => {
  await resetE2EFixtures(request);
  await signInFixture(page, E2E_USERS.clientB.email);
  await resetE2EFixtures(request, 'client_b_membership_removed');
  const response = await page.request.get('/app/modules/trustops');
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain('Access denied');
});
