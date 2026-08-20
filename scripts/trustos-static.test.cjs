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
  assert.match(shell, /<iframe[\s\S]*title="[^"]+"[\s\S]*sandbox="[^"]+"/);
  assert.doesNotMatch(shell, /allow-top-navigation/);
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
