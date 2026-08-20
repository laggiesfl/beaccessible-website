const test = require('node:test');
const assert = require('node:assert/strict');

let core = {};
try {
  core = require('../trustos-core.js');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

test('an unlicensed or unknown module can never enter the enabled module list', () => {
  assert.equal(typeof core.resolveEnabledModules, 'function');

  const catalogue = [
    { id: 'trustops' },
    { id: 'grantflow' }
  ];

  assert.deepEqual(
    core.resolveEnabledModules(catalogue, ['trustops', 'unknown', 'trustops']),
    [{ id: 'trustops' }]
  );
});

test('the requested opening module falls back to the first licensed module', () => {
  assert.equal(typeof core.resolveInitialModuleId, 'function');

  const enabledModules = [{ id: 'trustops' }, { id: 'grantflow' }];

  assert.equal(core.resolveInitialModuleId(enabledModules, 'grantflow'), 'grantflow');
  assert.equal(core.resolveInitialModuleId(enabledModules, 'unknown'), 'trustops');
  assert.equal(core.resolveInitialModuleId([], 'trustops'), null);
});
