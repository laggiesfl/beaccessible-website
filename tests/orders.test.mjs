import test from 'node:test';
import assert from 'node:assert/strict';
import * as orders from '../netlify/functions/lib/orders.mjs';
import { getProduct } from '../netlify/functions/lib/catalog.mjs';

const { createOrderRepository } = orders;

function createMemoryStore() {
  const values = new Map();
  return {
    async get(key) {
      return values.get(key) ?? null;
    },
    async set(key, value) {
      values.set(key, value);
      return { modified: true };
    },
    async getWithMetadata(key) {
      const data = values.get(key);
      return data === undefined ? null : { data, metadata: {} };
    }
  };
}

function createRepository() {
  let randomValue = 0;
  return createOrderRepository({
    store: createMemoryStore(),
    now: () => new Date('2026-08-13T12:00:00.000Z'),
    randomBytes: () => Buffer.from([0, 0, 0, randomValue++])
  });
}

const customer = {
  name: 'Test Customer',
  email: 'customer@example.com',
  organisation: 'Example Org'
};

test('site order storage uses the current named Netlify Blobs configuration', () => {
  const expectedStore = createMemoryStore();
  const store = orders.createSiteOrderStore?.((options) => {
    if (options?.name !== 'beaccessible-orders' || options?.consistency !== 'strong') {
      throw new Error('Invalid Netlify Blobs store configuration.');
    }
    return expectedStore;
  });

  assert.equal(store, expectedStore);
});

test('new orders have unique dated references and authoritative pending state', async () => {
  const repository = createRepository();
  const product = getProduct('ai-cost-audit');

  const first = await repository.createPendingOrder({ product, customer, policyVersion: '2026-08-13' });
  const second = await repository.createPendingOrder({ product, customer, policyVersion: '2026-08-13' });

  assert.match(first.orderRef, /^BA-20260813-[A-F0-9]{8}$/);
  assert.match(second.orderRef, /^BA-20260813-[A-F0-9]{8}$/);
  assert.notEqual(first.orderRef, second.orderRef);
  assert.equal(first.status, 'pending');
  assert.equal(first.amountCents, 350000);
  assert.equal(first.currency, 'ZAR');
  assert.equal(first.fulfilmentStatus, 'not_started');
  assert.equal(first.deliveryStatus, 'not_delivered');
  assert.equal(first.refundCancellationState, 'none');
});

test('new orders persist the minimum customer and policy acceptance record', async () => {
  const repository = createRepository();
  const product = getProduct('ai-cost-audit');
  const created = await repository.createPendingOrder({ product, customer, policyVersion: '2026-08-13' });

  const stored = await repository.getOrder(created.orderRef);
  assert.deepEqual(stored.customer, customer);
  assert.equal(stored.productCode, 'ai-cost-audit');
  assert.equal(stored.policyVersion, '2026-08-13');
  assert.equal(stored.acceptedAt, '2026-08-13T12:00:00.000Z');
  assert.equal(stored.payment, null);
});

test('paid transition happens once and preserves fulfilment state on duplicate notification', async () => {
  const repository = createRepository();
  const product = getProduct('ai-cost-audit');
  const created = await repository.createPendingOrder({ product, customer, policyVersion: '2026-08-13' });
  const payment = {
    payfastPaymentId: 'PF-12345',
    paymentStatus: 'COMPLETE',
    paidAt: '2026-08-13T12:05:00.000Z'
  };

  const first = await repository.markOrderPaid(created.orderRef, payment);
  const duplicate = await repository.markOrderPaid(created.orderRef, payment);

  assert.equal(first.changed, true);
  assert.equal(first.order.status, 'paid');
  assert.deepEqual(first.order.payment, payment);
  assert.equal(duplicate.changed, false);
  assert.deepEqual(duplicate.order, first.order);
  assert.equal(duplicate.order.fulfilmentStatus, 'not_started');
});

test('missing order cannot be marked paid', async () => {
  const repository = createRepository();
  await assert.rejects(
    repository.markOrderPaid('BA-20260813-FFFFFFFF', { payfastPaymentId: 'PF-1' }),
    /Order not found/
  );
});
