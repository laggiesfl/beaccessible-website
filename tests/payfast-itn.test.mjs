import test from 'node:test';
import assert from 'node:assert/strict';
import { createPayfastItnHandler } from '../netlify/functions/payfast-itn.mjs';
import { createOrderRepository } from '../netlify/functions/lib/orders.mjs';
import { generateItnSignature } from '../netlify/functions/lib/payfast.mjs';
import { getProduct } from '../netlify/functions/lib/catalog.mjs';

const env = {
  PAYFAST_MODE: 'sandbox',
  PAYFAST_SANDBOX_MERCHANT_ID: '10000100',
  PAYFAST_SANDBOX_PASSPHRASE: 'fixture passphrase'
};

function createMemoryStore() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) ?? null; },
    async set(key, value) { values.set(key, value); return { modified: true }; },
    async getWithMetadata(key) {
      const data = values.get(key);
      return data === undefined ? null : { data, metadata: {} };
    }
  };
}

async function createHarness(options = {}) {
  const repository = createOrderRepository({
    store: createMemoryStore(),
    now: () => new Date('2026-08-13T12:00:00.000Z'),
    randomBytes: () => Buffer.from('abcdef12', 'hex')
  });
  const product = getProduct('ai-cost-audit');
  const order = await repository.createPendingOrder({
    product,
    customer: { name: 'Test', email: 'test@example.com', organisation: '' },
    policyVersion: '2026-08-13'
  });
  const serverBodies = [];
  let paidCalls = 0;
  const handler = createPayfastItnHandler({
    env: options.env ?? env,
    getOrder: repository.getOrder,
    async markOrderPaid(...args) {
      paidCalls += 1;
      return repository.markOrderPaid(...args);
    },
    getSourceIp: () => options.sourceIp ?? '203.0.113.10',
    resolveHost: async (hostname) => {
      options.resolvedHosts?.push(hostname);
      return options.validAddresses ?? ['203.0.113.10'];
    },
    fetchImpl: async (_url, request) => {
      serverBodies.push(request.body);
      return { text: async () => options.serverResponse ?? 'VALID' };
    },
    now: () => new Date('2026-08-13T12:05:00.000Z')
  });
  return { handler, order, repository, serverBodies, get paidCalls() { return paidCalls; } };
}

function signedBody(overrides = {}) {
  const fields = {
    m_payment_id: 'BA-20260813-ABCDEF12',
    pf_payment_id: 'PF-123',
    payment_status: 'COMPLETE',
    amount_gross: '3500.00',
    merchant_id: '10000100',
    ...overrides
  };
  fields.signature = generateItnSignature(fields, env.PAYFAST_SANDBOX_PASSPHRASE);
  return new URLSearchParams(fields).toString();
}

function event(body) {
  return {
    httpMethod: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  };
}

test('fixed valid ITN fixture signature remains independently verified', () => {
  const body = signedBody();
  assert.match(body, /signature=793c6b654c936d858c327be02a6d8de7/);
});

test('invalid signature leaves the order pending', async () => {
  const harness = await createHarness();
  const response = await harness.handler(event(`${signedBody()}x`));

  assert.equal(response.statusCode, 400);
  assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
  assert.equal(harness.paidCalls, 0);
});

test('unknown order leaves the known order pending', async () => {
  const harness = await createHarness();
  const response = await harness.handler(event(signedBody({ m_payment_id: 'BA-20260813-FFFFFFFF' })));

  assert.equal(response.statusCode, 400);
  assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
  assert.equal(harness.paidCalls, 0);
});

test('amount mismatch leaves the order pending', async () => {
  const harness = await createHarness();
  const response = await harness.handler(event(signedBody({ amount_gross: '35.00' })));

  assert.equal(response.statusCode, 400);
  assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
  assert.equal(harness.paidCalls, 0);
});

test('wrong merchant or incomplete payment leaves the order pending', async () => {
  for (const overrides of [{ merchant_id: '99999999' }, { payment_status: 'FAILED' }]) {
    const harness = await createHarness();
    const response = await harness.handler(event(signedBody(overrides)));
    assert.equal(response.statusCode, 400);
    assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
    assert.equal(harness.paidCalls, 0);
  }
});

test('unrecognised source address leaves the order pending', async () => {
  const resolvedHosts = [];
  const harness = await createHarness({ validAddresses: ['198.51.100.2'], resolvedHosts });
  const response = await harness.handler(event(signedBody()));

  assert.equal(response.statusCode, 400);
  assert.ok(resolvedHosts.includes('sandbox.payfast.co.za'));
  assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
  assert.equal(harness.paidCalls, 0);
});

test('invalid Payfast server confirmation leaves the order pending', async () => {
  const harness = await createHarness({ serverResponse: 'INVALID' });
  const response = await harness.handler(event(signedBody()));

  assert.equal(response.statusCode, 400);
  assert.equal((await harness.repository.getOrder(harness.order.orderRef)).status, 'pending');
  assert.equal(harness.paidCalls, 0);
});

test('valid notification changes pending to paid exactly once', async () => {
  const harness = await createHarness();
  const first = await harness.handler(event(signedBody()));
  const duplicate = await harness.handler(event(signedBody()));
  const stored = await harness.repository.getOrder(harness.order.orderRef);

  assert.equal(first.statusCode, 200);
  assert.equal(duplicate.statusCode, 200);
  assert.equal(stored.status, 'paid');
  assert.deepEqual(stored.payment, {
    payfastPaymentId: 'PF-123',
    paymentStatus: 'COMPLETE',
    paidAt: '2026-08-13T12:05:00.000Z'
  });
  assert.equal(harness.paidCalls, 2);
  assert.equal(harness.serverBodies.length, 2);
  assert.doesNotMatch(harness.serverBodies[0], /signature=/);
});

test('non-POST requests and missing sandbox configuration fail closed', async () => {
  const harness = await createHarness({ env: { ...env, PAYFAST_MODE: 'live' } });
  const getResponse = await harness.handler({ httpMethod: 'GET', headers: {}, body: '' });
  const postResponse = await harness.handler(event(signedBody()));

  assert.equal(getResponse.statusCode, 405);
  assert.equal(postResponse.statusCode, 503);
  assert.equal(harness.paidCalls, 0);
});
