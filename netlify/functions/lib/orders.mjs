import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { getStore } from '@netlify/blobs';

function datePart(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

export function createOrderRepository({
  store,
  now = () => new Date(),
  randomBytes = nodeRandomBytes
}) {
  async function getOrder(orderRef) {
    const stored = await store.get(orderRef);
    return stored === null ? null : JSON.parse(stored);
  }

  async function createPendingOrder({ product, customer, policyVersion }) {
    const acceptedAt = now().toISOString();
    const orderRef = `BA-${datePart(new Date(acceptedAt))}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const order = {
      orderRef,
      productCode: product.code,
      productName: product.name,
      amountCents: product.amountCents,
      currency: product.currency,
      billing: product.billing,
      customer: {
        name: customer.name,
        email: customer.email,
        organisation: customer.organisation ?? ''
      },
      policyVersion,
      acceptedAt,
      status: 'pending',
      payment: null,
      fulfilmentStatus: 'not_started',
      deliveryStatus: 'not_delivered',
      refundCancellationState: 'none'
    };

    await store.set(orderRef, JSON.stringify(order));
    return order;
  }

  async function markOrderPaid(orderRef, payment) {
    const order = await getOrder(orderRef);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'paid') return { changed: false, order };

    const paidOrder = { ...order, status: 'paid', payment: { ...payment } };
    await store.set(orderRef, JSON.stringify(paidOrder));
    return { changed: true, order: paidOrder };
  }

  return { createPendingOrder, getOrder, markOrderPaid };
}

let defaultRepository;

export function createSiteOrderStore(getStoreImpl = getStore) {
  return getStoreImpl({ name: 'beaccessible-orders', consistency: 'strong' });
}

function getDefaultRepository() {
  defaultRepository ??= createOrderRepository({ store: createSiteOrderStore() });
  return defaultRepository;
}

export function createPendingOrder(input) {
  return getDefaultRepository().createPendingOrder(input);
}

export function getOrder(orderRef) {
  return getDefaultRepository().getOrder(orderRef);
}

export function markOrderPaid(orderRef, payment) {
  return getDefaultRepository().markOrderPaid(orderRef, payment);
}
