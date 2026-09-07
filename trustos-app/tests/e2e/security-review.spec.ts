import { expect, test } from '@playwright/test';

import { E2E_USERS } from './helpers/test-users';
import { signInFixture } from './helpers/supabase-fixtures';

const FORBIDDEN_SERVER_SECRET_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'RATE_LIMIT_HMAC_KEY',
  'CRON_SECRET',
  'E2E_FIXTURE_SECRET',
  'VERCEL_OIDC_TOKEN',
];

for (const path of ['/app', '/app/admin/team', '/app/audit', '/app/modules/grantflow']) {
  test(`${path} has no console errors or browser-visible server secret names`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const browserVisibleSecretNames: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    page.on('request', (request) => {
      const material = [request.url(), request.postData() ?? '', JSON.stringify(request.headers())].join('\n');
      for (const name of FORBIDDEN_SERVER_SECRET_NAMES) {
        if (material.includes(name)) browserVisibleSecretNames.push(name);
      }
    });

    await signInFixture(page, E2E_USERS.clientA.email);
    await page.goto(path, { waitUntil: 'networkidle' });

    expect(consoleErrors).toEqual([]);
    expect(browserVisibleSecretNames).toEqual([]);
  });
}
