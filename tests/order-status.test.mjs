import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderStatusHandler } from '../netlify/functions/order-status.mjs';

const pendingOrder = {
  orderRef: 'BA-20260813-ABCDEF12',
  status: 'pending',
  fulfilmentStatus: 'not_started',
  customer: {
    name: 'Test Customer',
    email: 'customer@example.com',
    organisation: 'Example Org'
  },
  payment: {
    payfastPaymentId: 'PF-SECRET',
    paymentStatus: 'COMPLETE'
  }
};

function event(order = pendingOrder.orderRef) {
  return { httpMethod: 'GET', queryStringParameters: { order } };
}

test('unknown order returns 404 without customer information', async () => {
  const handler = createOrderStatusHandler({ getOrder: async () => null });
  const response = await handler(event());

  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.doesNotMatch(response.body, /customer|email|payfast/i);
});

test('pending order response exposes only safe coarse status', async () => {
  const handler = createOrderStatusHandler({ getOrder: async () => pendingOrder });
  const response = await handler(event());
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(body, {
    orderRef: 'BA-20260813-ABCDEF12',
    paymentStatus: 'pending',
    fulfilmentStatus: 'not_started'
  });
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.doesNotMatch(response.body, /Test Customer|customer@example\.com|Example Org|PF-SECRET/);
});

test('paid order response exposes paid status without raw payment data', async () => {
  const handler = createOrderStatusHandler({
    getOrder: async () => ({ ...pendingOrder, status: 'paid', fulfilmentStatus: 'intake_sent' })
  });
  const response = await handler(event());

  assert.deepEqual(JSON.parse(response.body), {
    orderRef: 'BA-20260813-ABCDEF12',
    paymentStatus: 'paid',
    fulfilmentStatus: 'intake_sent'
  });
  assert.doesNotMatch(response.body, /payfast|PF-SECRET/i);
});

test('malformed order reference is rejected before lookup', async () => {
  let lookups = 0;
  const handler = createOrderStatusHandler({
    async getOrder() { lookups += 1; return pendingOrder; }
  });
  const response = await handler(event('../../secret'));

  assert.equal(response.statusCode, 400);
  assert.equal(lookups, 0);
});

test('non-GET requests are rejected', async () => {
  const handler = createOrderStatusHandler({ getOrder: async () => pendingOrder });
  const response = await handler({ httpMethod: 'POST', queryStringParameters: {} });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'GET');
});
