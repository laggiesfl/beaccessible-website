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

test('the module catalogue validator rejects malformed and duplicate records', () => {
  assert.equal(typeof core.validateModuleCatalogue, 'function');

  const result = core.validateModuleCatalogue([
    {
      id: 'trustops', name: 'TrustOps Core', shortName: 'TrustOps',
      description: 'Trust operations', source: 'trustops.html',
      frameTitle: 'TrustOps demonstration'
    },
    { id: 'trustops', name: 'Duplicate' },
    null
  ]);

  assert.equal(result.isValid, false);
  assert.equal(result.modules.length, 1);
  assert.equal(result.modules[0].id, 'trustops');
  assert.equal(result.invalidCount, 2);
});
