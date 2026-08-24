const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'trustos.html'), 'utf8');
const trustOps = fs.readFileSync(path.join(root, 'trustops.html'), 'utf8');
const grantFlow = fs.readFileSync(path.join(root, 'grantflow.html'), 'utf8');

test('TrustOS shell includes accessible navigation and a constrained module frame', () => {
  assert.equal((shell.match(/<h1\b/g) || []).length, 1);
  assert.match(shell, /href="#module-nav"/);
  assert.match(shell, /href="#module-workspace"/);
  assert.match(shell, /id="module-frames"/);
  assert.doesNotMatch(shell, /<iframe\b/);
  assert.match(shell, /id="module-workspace"[^>]*hidden/);
  assert.doesNotMatch(shell, /allow-top-navigation/);
  assert.doesNotMatch(shell, /allow-forms/);
});

test('TrustOS describes module availability as demonstration configuration, not licence enforcement', () => {
  assert.match(shell, /Demo module configuration/);
  assert.match(shell, /presentation-only/i);
  assert.doesNotMatch(shell, /Licensed for|this licence|Your licence/i);
});

test('TrustOS shell links to dedicated privacy and accessibility statements', () => {
  for (const fileName of ['trustos-privacy.html', 'trustos-accessibility.html']) {
    assert.match(shell, new RegExp('href="' + fileName.replace('.', '\\.') + '"'));
    assert.equal(fs.existsSync(path.join(root, fileName)), true, fileName + ' must exist');
  }
});

test('every local script referenced by the TrustOS shell exists', () => {
  const scripts = [...shell.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(scripts, ['trustos-core.js', 'trustos-config.js', 'trustos-shell.js']);
  scripts.forEach((fileName) => assert.equal(fs.existsSync(path.join(root, fileName)), true));
});

test('TrustOps activates its compact layout only when embedded in TrustOS', () => {
  const scriptMatch = trustOps.match(/<script id="trustos-layout-mode">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'TrustOps must provide an embedded layout mode');

  function runWithSearch(search) {
    const classes = new Set();
    vm.runInNewContext(scriptMatch[1], {
      location: { search },
      document: {
        documentElement: {
          classList: { add(value) { classes.add(value); } }
        }
      },
      URLSearchParams
    });
    return classes;
  }

  assert.equal(runWithSearch('?embedded=1').has('trustos-embedded'), true);
  assert.equal(runWithSearch('').has('trustos-embedded'), false);
});

test('GrantFlow navigation uses the BeAccessible palette and exposes the active view', () => {
  const styles = grantFlow.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
  const navButtonRule = styles.match(/nav button\s*\{([\s\S]*?)\}/)?.[1] || '';
  const activeButtonRule = styles.match(/nav button\[aria-current="page"\]\s*\{([\s\S]*?)\}/)?.[1] || '';

  assert.match(navButtonRule, /background:\s*var\(--deep-blue\)/);
  assert.match(navButtonRule, /border-color:\s*var\(--soft-blue\)/);
  assert.match(activeButtonRule, /background:\s*var\(--soft-blue\)/);
  assert.match(activeButtonRule, /box-shadow:\s*inset/);

  const scriptMatch = grantFlow.match(/<script id="grantflow-navigation-state">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'GrantFlow must provide an accessible navigation-state controller');

  function createButton(section) {
    const classes = new Set();
    const attributes = new Map([['aria-controls', section]]);
    return {
      classList: {
        add(value) { classes.add(value); },
        remove(value) { classes.delete(value); },
        toggle(value, enabled) { enabled ? classes.add(value) : classes.delete(value); }
      },
      getAttribute(name) { return attributes.get(name) || null; },
      setAttribute(name, value) { attributes.set(name, value); },
      removeAttribute(name) { attributes.delete(name); },
      hasClass(name) { return classes.has(name); },
      attribute(name) { return attributes.get(name); }
    };
  }

  const dashboard = createButton('dashboard');
  const applications = createButton('applications');
  const context = {
    document: { querySelectorAll() { return [dashboard, applications]; } }
  };
  vm.runInNewContext(scriptMatch[1], context);
  context.syncGrantFlowNavigation('applications');

  assert.equal(dashboard.hasClass('active'), false);
  assert.equal(dashboard.attribute('aria-current'), undefined);
  assert.equal(applications.hasClass('active'), true);
  assert.equal(applications.attribute('aria-current'), 'page');
});

test('GrantFlow pilot interaction is sample-only and cannot submit to a network service', () => {
  assert.match(grantFlow, /form-action\s+'none'/);
  assert.doesNotMatch(grantFlow, /data-netlify|netlify-honeypot|method="POST"|form-name/);
  assert.doesNotMatch(grantFlow, /wired for Netlify|submit to Netlify/i);
  assert.doesNotMatch(grantFlow, /lead-generating entry point|>Request Pilot</i);
  assert.match(grantFlow, />View sample request</);
  assert.match(grantFlow, /id="pilotName"[^>]*readonly/);
  assert.match(grantFlow, /id="pilotEmail"[^>]*readonly/);
  assert.match(grantFlow, /id="pilotType"[^>]*disabled/);
  assert.match(grantFlow, /id="pilotMessage"[^>]*readonly/);
  assert.match(grantFlow, /Simulate sample request/);
});

test('legacy product copy accurately describes the Phase 1 demonstration boundary', () => {
  for (const unsupportedClaim of [
    /automated grant management/i,
    /role-based access/i,
    /up to 60% admin reduction/i,
    /real-time portfolio visibility/i
  ]) {
    assert.doesNotMatch(grantFlow, unsupportedClaim);
  }

  assert.match(grantFlow, /manual demonstration/i);
  assert.match(trustOps, /credentials remain in this browser and are ignored/i);
  assert.doesNotMatch(trustOps, /use email to authenticate/i);
});

test('sandbox-safe demo actions do not depend on browser form submission', () => {
  assert.match(trustOps, /<button type="button" id="demo-sign-in-button"/);
  assert.match(trustOps, /getElementById\('demo-sign-in-button'\)\.addEventListener\('click', openDemo\)/);
  assert.match(trustOps, /getElementById\('login-form'\)\.addEventListener\('keydown'/);
  assert.match(grantFlow, /<form name="pilot-request" onsubmit="return false;">/);
  assert.match(grantFlow, /<button type="button" onclick="handlePilotRequest\(event\)">Simulate sample request<\/button>/);
});

test('GrantFlow scripted scrolling respects reduced-motion preferences', () => {
  assert.match(grantFlow, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(grantFlow, /behavior:\s*reduceMotion\.matches\s*\?\s*'auto'\s*:\s*'smooth'/);
});

test('the privacy notice identifies hosting, retention limits, rights, and complaint routes', () => {
  const privacy = fs.readFileSync(path.join(root, 'trustos-privacy.html'), 'utf8');
  assert.match(privacy, /hosted on Vercel/i);
  assert.match(privacy, /retention/i);
  assert.match(privacy, /outside South Africa/i);
  assert.match(privacy, /responsible party/i);
  assert.match(privacy, /Information Regulator/i);
  assert.match(privacy, /https:\/\/www\.beaccessible\.co\.za\/privacy\.html/);
});

test('accessibility statement accurately describes the current assessment evidence', () => {
  const accessibility = fs.readFileSync(path.join(root, 'trustos-accessibility.html'), 'utf8');
  assert.match(accessibility, /automated source and integration checks/i);
  assert.doesNotMatch(accessibility, /keyboard-oriented regression checks/i);
});

test('version-controlled Vercel headers harden the dedicated TrustOS deployment', () => {
  const manifestPath = path.join(root, 'trustos-vercel.json');
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const headers = manifest.headers?.[0]?.headers || [];
  const values = Object.fromEntries(headers.map((header) => [header.key, header.value]));

  assert.equal(manifest.headers[0].source, '/(.*)');
  assert.match(values['Content-Security-Policy'], /form-action 'none'/);
  assert.equal(values['X-Content-Type-Options'], 'nosniff');
  assert.equal(values['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.match(values['Permissions-Policy'], /camera=\(\)/);
});

test('browser checks explain local skips and can be required for release', () => {
  const browserTest = fs.readFileSync(path.join(root, 'scripts', 'trustos-browser.test.cjs'), 'utf8');
  assert.match(browserTest, /TRUSTOS_REQUIRE_BROWSER/);
  assert.match(browserTest, /Chromium is required for TrustOS release verification/);
  assert.match(browserTest, /Chromium executable is not installed/);
});
