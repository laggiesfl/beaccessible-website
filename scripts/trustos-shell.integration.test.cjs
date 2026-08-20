const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../trustos-core.js');

class ClassList {
  constructor() { this.values = new Set(); }
  toggle(value, force) {
    if (force) this.values.add(value);
    else this.values.delete(value);
  }
  contains(value) { return this.values.has(value); }
}

class Element {
  constructor(tagName, id = '') {
    this.tagName = tagName;
    this.id = id;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.classList = new ClassList();
    this.listeners = {};
    this.hidden = false;
    this.textContent = '';
    this.innerHTML = '';
    this.href = '';
    this.src = '';
    this.title = '';
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  querySelectorAll(selector) {
    if (selector === 'button') return this.children.filter((child) => child.tagName === 'button');
    return [];
  }
  click() { if (this.listeners.click) this.listeners.click(); }
}

function createHarness(config, catalogueOverride) {
  const ids = [
    'module-buttons', 'unavailable-modules', 'unavailable-region', 'empty-state',
    'module-workspace', 'module-frame', 'module-title', 'module-description',
    'standalone-link', 'suite-status', 'licensed-for'
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element('div', id)]));
  elements['module-frame'].tagName = 'iframe';
  elements['standalone-link'].tagName = 'a';

  const catalogue = catalogueOverride || [
    {
      id: 'trustops', name: 'TrustOps Core', shortName: 'TrustOps',
      description: 'Trust operations', source: 'trustops.html',
      embeddedSource: 'trustops.html?embedded=1',
      frameTitle: 'TrustOps Core demonstration'
    },
    {
      id: 'grantflow', name: 'GrantFlow', shortName: 'GrantFlow',
      description: 'Grant lifecycle', source: 'grantflow.html',
      frameTitle: 'GrantFlow demonstration'
    }
  ];

  const context = {
    window: {
      TRUSTOS_SUITE_CONFIG: config,
      TRUSTOS_MODULE_CATALOGUE: catalogue,
      TrustOSCore: core
    },
    document: {
      title: 'TrustOS | BeAccessible',
      getElementById(id) { return elements[id]; },
      createElement(tagName) { return new Element(tagName); }
    }
  };
  context.globalThis = context.window;

  const source = fs.readFileSync(path.resolve(__dirname, '..', 'trustos-shell.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'trustos-shell.js' });
  return { context, elements };
}

test('the consolidated shell opens each licensed product without rewriting it', () => {
  const { elements } = createHarness({
    organisationName: 'Example Trust',
    licensedModuleIds: ['trustops', 'grantflow'],
    requestedModuleId: 'trustops'
  });

  const buttons = elements['module-buttons'].children;
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].dataset.moduleId, 'trustops');
  assert.equal(buttons[1].dataset.moduleId, 'grantflow');
  assert.equal(elements['module-frame'].title, 'TrustOps Core demonstration');
  assert.equal(elements['module-frame'].src, 'trustops.html?embedded=1');
  assert.equal(elements['standalone-link'].href, 'trustops.html');

  buttons[1].click();

  assert.equal(elements['module-frame'].title, 'GrantFlow demonstration');
  assert.equal(elements['module-frame'].src, 'grantflow.html');
  assert.equal(elements['suite-status'].textContent, 'GrantFlow opened.');
});

test('the shell exposes only licensed modules and names unavailable modules without an action', () => {
  const { elements } = createHarness({
    organisationName: 'TrustOps-only client',
    licensedModuleIds: ['trustops'],
    requestedModuleId: 'grantflow'
  });

  assert.equal(elements['module-buttons'].children.length, 1);
  assert.equal(elements['module-buttons'].children[0].dataset.moduleId, 'trustops');
  assert.equal(elements['module-frame'].src, 'trustops.html?embedded=1');
  assert.equal(elements['standalone-link'].href, 'trustops.html');
  assert.equal(elements['unavailable-region'].hidden, false);
  assert.equal(elements['unavailable-modules'].children.length, 1);
  assert.equal(elements['unavailable-modules'].children[0].children[0].textContent, 'GrantFlow');
  assert.equal(elements['unavailable-modules'].children[0].children[1].textContent, 'Not included in this licence.');
});

test('a licence with no modules shows a recoverable empty state', () => {
  const { elements } = createHarness({
    organisationName: 'Unconfigured client',
    licensedModuleIds: [],
    requestedModuleId: 'trustops'
  });

  assert.equal(elements['module-workspace'].hidden, true);
  assert.equal(elements['empty-state'].hidden, false);
  assert.equal(elements['suite-status'].textContent, 'No TrustOS modules are enabled for this licence.');
});

test('module catalogue labels are rendered as text rather than executable markup', () => {
  const { elements } = createHarness(
    {
      organisationName: 'Security test',
      licensedModuleIds: ['trustops'],
      requestedModuleId: 'trustops'
    },
    [
      {
        id: 'trustops',
        name: '<img src=x onerror=alert(1)>',
        shortName: 'TrustOps',
        description: '<script>alert(1)</script>',
        source: 'trustops.html',
        frameTitle: 'TrustOps Core demonstration'
      }
    ]
  );

  const button = elements['module-buttons'].children[0];
  assert.equal(button.innerHTML, '');
  assert.equal(button.children[0].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(button.children[1].textContent, '<script>alert(1)</script>');
});
