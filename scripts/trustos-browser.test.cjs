const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
process.env.TMPDIR = root;

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ||
  '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(runtimeModules, 'playwright'));
const hasBrowserExecutable = fs.existsSync(chromium.executablePath());
const requireBrowser = process.env.TRUSTOS_REQUIRE_BROWSER === '1';

if (requireBrowser && !hasBrowserExecutable) {
  throw new Error(
    'Chromium is required for TrustOS release verification. Chromium executable is not installed.'
  );
}

function browserTest(name, testFunction) {
  return test(name, {
    skip: hasBrowserExecutable ? false :
      'Chromium executable is not installed; browser verification remains pending.'
  }, testFunction);
}

const allowedFiles = new Set([
  'trustos.html', 'trustos-core.js', 'trustos-config.js', 'trustos-shell.js',
  'trustops.html', 'grantflow.html', 'trustos-privacy.html', 'trustos-accessibility.html'
]);
const vercelManifest = JSON.parse(
  fs.readFileSync(path.join(root, 'trustos-vercel.json'), 'utf8')
);
const deploymentHeaders = Object.fromEntries(
  vercelManifest.headers[0].headers.map((header) => [header.key, header.value])
);

let server;
let browser;
let baseUrl;

function contentType(fileName) {
  if (fileName.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'text/html; charset=utf-8';
}

test.before(async () => {
  if (!hasBrowserExecutable) return;
  server = http.createServer((request, response) => {
    const requestPath = new URL(request.url, 'http://127.0.0.1').pathname;
    const fileName = requestPath === '/' ? 'trustos.html' : path.basename(requestPath);

    if (!allowedFiles.has(fileName)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentType(fileName),
      ...deploymentHeaders
    });
    response.end(fs.readFileSync(path.join(root, fileName)));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

browserTest('rendered shell preserves module state and supports keyboard module switching', async () => {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-security-policy'], /form-action 'none'/);
  await page.getByRole('heading', { name: 'TrustOS', level: 1 }).waitFor();
  assert.equal(await page.locator('#module-frames iframe').count(), 2);

  const trustOpsEmail = page
    .frameLocator('iframe[data-module-id="trustops"]')
    .locator('#email');
  await trustOpsEmail.fill('state-check@example.invalid');

  const grantFlowButton = page.getByRole('button', { name: /GrantFlow/ });
  await grantFlowButton.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('iframe[data-module-id="grantflow"]').evaluate((frame) => frame.hidden), false);

  const trustOpsButton = page.getByRole('button', { name: /TrustOps Core/ });
  await trustOpsButton.focus();
  await page.keyboard.press('Enter');
  assert.equal(await trustOpsEmail.inputValue(), 'state-check@example.invalid');

  await trustOpsButton.click();
  assert.equal(await trustOpsEmail.inputValue(), 'state-check@example.invalid');
  assert.deepEqual(pageErrors, []);
  await page.close();
});

browserTest('no-script and zero-module configurations load no product frame', async () => {
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(baseUrl);
  assert.equal(await noScriptPage.locator('iframe').count(), 0);
  await noScriptPage.locator('noscript').waitFor({ state: 'visible' });
  assert.equal(await noScriptPage.locator('#module-workspace').evaluate((element) => element.hidden), true);
  await noScriptContext.close();

  const zeroPage = await browser.newPage();
  await zeroPage.route('**/trustos-config.js', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: "globalThis.TRUSTOS_SUITE_CONFIG={organisationName:'Zero modules',licensedModuleIds:[],requestedModuleId:null};globalThis.TRUSTOS_MODULE_CATALOGUE=[];"
  }));
  await zeroPage.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(await zeroPage.locator('iframe').count(), 0);
  await zeroPage.getByRole('heading', { name: 'No modules enabled' }).waitFor();
  await zeroPage.close();
});

browserTest('malformed configuration fails closed in the rendered shell', async () => {
  const page = await browser.newPage();
  await page.route('**/trustos-config.js', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: "globalThis.TRUSTOS_SUITE_CONFIG={organisationName:'Broken',licensedModuleIds:['broken']};globalThis.TRUSTOS_MODULE_CATALOGUE=[{id:'broken',name:'Broken'}];"
  }));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('iframe').count(), 0);
  await page.getByRole('heading', { name: 'Module configuration unavailable' }).waitFor();
  assert.match(await page.locator('#suite-status').textContent(), /configuration error/i);
  await page.close();
});

browserTest('standalone GrantFlow cannot collect or submit pilot data', async () => {
  const page = await browser.newPage();
  const nonGetRequests = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') nonGetRequests.push(request.method());
  });

  await page.goto(`${baseUrl}/grantflow.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#pilotName').getAttribute('readonly'), '');
  assert.equal(await page.locator('#pilotEmail').getAttribute('readonly'), '');
  assert.equal(await page.locator('#pilotType').isDisabled(), true);
  await page.getByRole('button', { name: 'Simulate sample request' }).click();
  await page.getByText('Nothing was collected or sent.').waitFor();
  assert.deepEqual(nonGetRequests, []);
  await page.close();
});
