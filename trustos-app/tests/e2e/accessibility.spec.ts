import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { resetE2EFixtures, signInFixture } from './helpers/supabase-fixtures';
import { E2E_IDS, E2E_USERS } from './helpers/test-users';

async function expectNoAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
}

test('sign-in is keyboard usable and axe-clean', async ({ page }) => {
  await page.goto('/sign-in');
  await expectNoAxeViolations(page);
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
});

test('invitation activation screen is axe-clean', async ({ page, request }) => {
  await resetE2EFixtures(request);
  await signInFixture(page, E2E_USERS.invitee.email);
  await page.goto(`/accept-invitation?invitation=${E2E_IDS.invitation}`);
  await expect(page.getByRole('heading', { name: 'Activate your TrustOS account' })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('client workspace, team administration and audit are axe-clean', async ({ page }) => {
  await signInFixture(page, E2E_USERS.clientA.email);
  await expectNoAxeViolations(page);
  await page.goto('/app/admin/team');
  await expectNoAxeViolations(page);
  await page.goto('/app/audit');
  await expectNoAxeViolations(page);
});

test('platform administration is axe-clean', async ({ page }) => {
  await signInFixture(page, E2E_USERS.platformAdmin.email);
  await page.goto('/app/admin/platform');
  await expectNoAxeViolations(page);
});

test('320 CSS px reflow has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/sign-in');
  await expectNoHorizontalOverflow(page);
  await signInFixture(page, E2E_USERS.clientA.email);
  await expectNoHorizontalOverflow(page);
  await page.goto('/app/admin/team');
  await expectNoHorizontalOverflow(page);
  await page.goto('/app/audit');
  await expectNoHorizontalOverflow(page);
});

test('reduced-motion preference suppresses motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sign-in');
  const values = await page.locator('body').evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
  });
  const durationToMs = (value: string) =>
    value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
  expect(durationToMs(values.animationDuration)).toBeCloseTo(0.01, 5);
  expect(durationToMs(values.transitionDuration)).toBeCloseTo(0.01, 5);
});

test('forced-colours mode remains usable and axe-clean', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Sign in to TrustOS' })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('sign-in error summary receives focus after failed submission', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill(E2E_USERS.clientA.email);
  await page.getByLabel('Password').fill('incorrect-e2e-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const summary = page.locator('.error-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
});
