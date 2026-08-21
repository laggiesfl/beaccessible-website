import test from 'node:test';
import assert from 'node:assert/strict';
import { getProduct } from '../netlify/functions/lib/catalog.mjs';

test('AI Cost Audit is authoritative at R3500 ZAR once-off', () => {
  const product = getProduct('ai-cost-audit');
  assert.equal(product.amountCents, 350000);
  assert.equal(product.currency, 'ZAR');
  assert.equal(product.billing, 'once-off');
});

test('unknown products are rejected', () => {
  assert.equal(getProduct('biaslens'), null);
  assert.equal(getProduct('udl-pro'), null);
});
