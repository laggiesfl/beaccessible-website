import test from 'node:test';
import assert from 'node:assert/strict';
import {
  amountMatches,
  generateItnSignature,
  generatePaymentSignature,
  parseFormBody,
  sandboxProcessUrl,
  sandboxValidateUrl
} from '../netlify/functions/lib/payfast.mjs';

test('payment signature uses Payfast field order and form encoding', () => {
  const fields = {
    amount: '3500.00',
    email_address: 'buyer+test@example.com',
    merchant_key: '46f0cd694581a',
    item_name: 'BeAccessible AI Cost Audit',
    notify_url: 'https://example.com/notify',
    merchant_id: '10000100',
    m_payment_id: 'BA-20260813-ABC123',
    cancel_url: 'https://example.com/cancel',
    name_last: 'Buyer',
    return_url: 'https://example.com/return?order=BA-1',
    name_first: 'Test'
  };

  assert.equal(
    generatePaymentSignature(fields, 'fixture passphrase'),
    'fe057e0eda95e411373d85972f578385'
  );
});

test('payment signature matches PHP urlencode semantics for asterisks', () => {
  const fields = {
    merchant_id: '10000100',
    merchant_key: 'abc123',
    amount: '100.00',
    item_name: 'Test*Item'
  };

  assert.equal(
    generatePaymentSignature(fields, 'abc*123'),
    'ddae38eb8ebfc3a6d45dee52375cbcea'
  );
});

test('payment signature trims values and ignores blanks', () => {
  assert.equal(
    generatePaymentSignature({ merchant_id: ' 10000100 ', merchant_key: '', amount: ' 3500.00 ' }),
    '239df2c0b276f6089dfdd43cdf287fcc'
  );
});

test('ITN signature preserves posted sequence up to signature', () => {
  const fields = {
    m_payment_id: 'BA-20260813-ABC123',
    pf_payment_id: '123456',
    payment_status: 'COMPLETE',
    amount_gross: '3500.00',
    email_address: 'buyer+test@example.com',
    signature: 'received-signature',
    ignored_after_signature: 'must-not-be-signed'
  };

  assert.equal(
    generateItnSignature(fields, 'fixture passphrase'),
    '8a9b57fa9546d3bd9fcff1a8b0f3376b'
  );
});

test('form body parser decodes plus spaces and encoded characters', () => {
  assert.deepEqual(
    parseFormBody('name_first=Test+Buyer&email_address=buyer%2Btest%40example.com&empty='),
    { name_first: 'Test Buyer', email_address: 'buyer+test@example.com', empty: '' }
  );
});

test('R3500 matches amount_gross 3500.00', () => {
  assert.equal(amountMatches(350000, '3500.00'), true);
});

test('R3500 rejects amount_gross 35.00', () => {
  assert.equal(amountMatches(350000, '35.00'), false);
});

test('invalid or over-precise amounts are rejected', () => {
  assert.equal(amountMatches(350000, 'not-a-number'), false);
  assert.equal(amountMatches(350000, '3500.001'), false);
});

test('only Payfast Sandbox endpoints are exposed', () => {
  assert.equal(sandboxProcessUrl(), 'https://sandbox.payfast.co.za/eng/process');
  assert.equal(sandboxValidateUrl(), 'https://sandbox.payfast.co.za/eng/query/validate');
});
