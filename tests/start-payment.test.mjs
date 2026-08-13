import test from 'node:test';
import assert from 'node:assert/strict';
import * as startPayment from '../netlify/functions/start-payment.mjs';

const { createStartPaymentHandler } = startPayment;

const sandboxEnv = {
  PAYFAST_MODE: 'sandbox',
  PAYFAST_SANDBOX_MERCHANT_ID: '10000100',
  PAYFAST_SANDBOX_MERCHANT_KEY: '46f0cd694581a',
  PAYFAST_SANDBOX_PASSPHRASE: 'fixture passphrase',
  DEPLOY_PRIME_URL: 'https://phase-3--example.netlify.app'
};

function validInput(overrides = {}) {
  return {
    productCode: 'ai-cost-audit',
    name: 'Test Customer',
    email: 'customer@example.com',
    organisation: 'Example Org',
    acceptedPolicies: true,
    ...overrides
  };
}

function createHarness(env = sandboxEnv) {
  const created = [];
  const handler = createStartPaymentHandler({
    env,
    async createPendingOrder(input) {
      created.push(input);
      return { orderRef: 'BA-20260813-ABCDEF12' };
    }
  });
  return { handler, created };
}

test('modern Netlify Function adapter passes requests to the payment handler', async () => {
  const fetchHandler = startPayment.createFetchHandler?.(async (event) => ({
    statusCode: event.httpMethod === 'POST' && event.rawUrl.endsWith('/start-payment') ? 201 : 500,
    headers: { 'Content-Type': 'text/plain', 'X-Test': 'adapter' },
    body: event.body
  }));
  const response = await fetchHandler?.(new Request('https://example.netlify.app/start-payment', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: 'request body'
  }));

  assert.equal(response?.status, 201);
  assert.equal(response?.headers.get('x-test'), 'adapter');
  assert.equal(await response?.text(), 'request body');
});

test('unknown product is rejected without creating an order', async () => {
  const { handler, created } = createHarness();
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput({ productCode: 'biaslens' }))
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /successful payment has not been confirmed/i);
  assert.deepEqual(created, []);
});

test('tampered browser amount cannot alter the authoritative R3500 payment', async () => {
  const { handler, created } = createHarness();
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput({ amount: '1.00' }))
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /name="amount" value="3500\.00"/);
  assert.doesNotMatch(response.body, /name="amount" value="1\.00"/);
  assert.equal(created[0].product.amountCents, 350000);
});

test('valid request renders only a signed Payfast Sandbox form with a manual fallback', async () => {
  const { handler } = createHarness();
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput())
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Type'], /text\/html/);
  assert.match(response.body, /<title>Continue to secure payment \| BeAccessible<\/title>/);
  assert.match(response.body, /action="https:\/\/sandbox\.payfast\.co\.za\/eng\/process"/);
  assert.match(response.body, /Continue to Payfast Sandbox/);
  assert.match(response.body, /name="signature" value="[a-f0-9]{32}"/);
  assert.doesNotMatch(response.body, /fixture passphrase/);
  assert.doesNotMatch(response.body, /https:\/\/www\.payfast\.co\.za/);
});

test('manual Netlify preview derives its secure site address from the request URL', async () => {
  const { DEPLOY_PRIME_URL, ...previewEnv } = sandboxEnv;
  const { handler } = createHarness(previewEnv);
  const response = await handler({
    httpMethod: 'POST',
    rawUrl: 'https://phase-3-payfast-gate--example.netlify.app/.netlify/functions/start-payment',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput())
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /name="return_url" value="https:\/\/phase-3-payfast-gate--example\.netlify\.app\/payment-return\.html/);
  assert.match(response.body, /name="notify_url" value="https:\/\/phase-3-payfast-gate--example\.netlify\.app\/\.netlify\/functions\/payfast-itn"/);
});

test('form input converts the checked policy field to a strict boolean', async () => {
  const { handler, created } = createHarness();
  const body = new URLSearchParams({
    productCode: 'ai-cost-audit',
    name: 'Test Customer',
    email: 'customer@example.com',
    organisation: '',
    acceptedPolicies: 'on'
  }).toString();
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  assert.equal(response.statusCode, 200);
  assert.equal(created[0].customer.name, 'Test Customer');
});

test('invalid email and missing policy acceptance are rejected accessibly', async () => {
  const { handler, created } = createHarness();
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput({ email: 'not-an-email', acceptedPolicies: false }))
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /role="alert"/);
  assert.match(response.body, /href="#email">Enter a valid email address/);
  assert.match(response.body, /href="#acceptedPolicies">Accept the purchase and refund policies/);
  assert.match(response.body, /id="name"[^>]*value="Test Customer"/);
  assert.match(response.body, /id="email"[^>]*value="not-an-email"/);
  assert.match(response.body, /id="organisation"[^>]*value="Example Org"/);
  assert.deepEqual(created, []);
});

test('missing or non-sandbox configuration fails closed', async () => {
  const { handler, created } = createHarness({ ...sandboxEnv, PAYFAST_MODE: 'live' });
  const response = await handler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validInput())
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.body, /successful payment has not been confirmed/i);
  assert.deepEqual(created, []);
});

test('non-POST requests are rejected', async () => {
  const { handler } = createHarness();
  const response = await handler({ httpMethod: 'GET', headers: {}, body: '' });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
});
