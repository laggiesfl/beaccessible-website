import { getOrder as getStoredOrder } from './lib/orders.mjs';

const ORDER_REF_PATTERN = /^BA-\d{8}-[A-F0-9]{8}$/;

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

export function createOrderStatusHandler({ getOrder = getStoredOrder } = {}) {
  return async function orderStatus(event) {
    if (event.httpMethod !== 'GET') {
      return jsonResponse(405, { error: 'Method not allowed.' }, { Allow: 'GET' });
    }

    const orderRef = event.queryStringParameters?.order ?? '';
    if (!ORDER_REF_PATTERN.test(orderRef)) {
      return jsonResponse(400, { error: 'Enter a valid order reference.' });
    }

    const order = await getOrder(orderRef);
    if (!order) return jsonResponse(404, { error: 'Order not found.' });

    return jsonResponse(200, {
      orderRef: order.orderRef,
      paymentStatus: order.status,
      fulfilmentStatus: order.fulfilmentStatus
    });
  };
}

export const handler = createOrderStatusHandler();
