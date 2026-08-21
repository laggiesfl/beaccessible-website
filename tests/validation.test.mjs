import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCheckoutInput } from '../netlify/functions/lib/validation.mjs';

test('valid checkout input is normalised', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: '  Test Customer  ',
    email: 'customer@example.com',
    organisation: 'Example Org',
    acceptedPolicies: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, 'Test Customer');
  assert.equal(result.value.organisation, 'Example Org');
});

test('invalid email is rejected', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: 'Test',
    email: 'not-an-email',
    organisation: '',
    acceptedPolicies: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'email'));
});

test('policy acceptance is required', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: 'Test',
    email: 'customer@example.com',
    organisation: '',
    acceptedPolicies: false
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'acceptedPolicies'));
});

test('only the allow-listed product is accepted', () => {
  const result = validateCheckoutInput({
    productCode: 'biaslens',
    name: 'Test',
    email: 'customer@example.com',
    organisation: '',
    acceptedPolicies: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'productCode'));
});

test('customer name is required and limited to 120 characters', () => {
  for (const name of ['', 'x'.repeat(121)]) {
    const result = validateCheckoutInput({
      productCode: 'ai-cost-audit',
      name,
      email: 'customer@example.com',
      organisation: '',
      acceptedPolicies: true
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.field === 'name'));
  }
});

test('email is limited to 254 characters', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: 'Test',
    email: `${'a'.repeat(243)}@example.com`,
    organisation: '',
    acceptedPolicies: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'email'));
});

test('organisation is optional and limited to 120 characters', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: 'Test',
    email: 'customer@example.com',
    organisation: 'x'.repeat(121),
    acceptedPolicies: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'organisation'));
});

test('policy acceptance must be the boolean true', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: 'Test',
    email: 'customer@example.com',
    organisation: '',
    acceptedPolicies: 'true'
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.field === 'acceptedPolicies'));
});

test('non-object input returns field errors instead of throwing', () => {
  const result = validateCheckoutInput(null);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});
