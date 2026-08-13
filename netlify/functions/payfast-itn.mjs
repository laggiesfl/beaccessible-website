import { timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { getOrder as getStoredOrder, markOrderPaid as markStoredOrderPaid } from './lib/orders.mjs';
import {
  amountMatches,
  generateItnSignature,
  parseFormBody,
  sandboxValidateUrl
} from './lib/payfast.mjs';

const PAYFAST_HOSTS = [
  'www.payfast.co.za',
  'w1w.payfast.co.za',
  'w2w.payfast.co.za',
  'sandbox.payfast.co.za'
];

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body
  };
}

function secureEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parameterString(fields) {
  const pairs = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'signature') break;
    if (value !== '') pairs.push([key, value]);
  }
  return new URLSearchParams(pairs).toString();
}

function platformSourceIp(event) {
  if (event.requestContext?.http?.sourceIp) return event.requestContext.http.sourceIp;
  const header = Object.entries(event.headers ?? {})
    .find(([key]) => key.toLowerCase() === 'x-nf-client-connection-ip');
  return header?.[1] ?? null;
}

function normaliseIp(address) {
  return String(address).replace(/^::ffff:/, '').toLowerCase();
}

async function defaultResolveHost(hostname) {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map(({ address }) => address);
}

async function isPayfastSource(sourceIp, resolveHost) {
  if (!sourceIp) return false;
  const validAddresses = new Set();

  try {
    for (const hostname of PAYFAST_HOSTS) {
      const records = await resolveHost(hostname);
      for (const record of records) {
        validAddresses.add(normaliseIp(typeof record === 'string' ? record : record.address));
      }
    }
  } catch {
    return false;
  }

  return validAddresses.has(normaliseIp(sourceIp));
}

function configuration(env) {
  if (
    env.PAYFAST_MODE !== 'sandbox' ||
    !env.PAYFAST_SANDBOX_MERCHANT_ID ||
    !env.PAYFAST_SANDBOX_PASSPHRASE
  ) {
    return null;
  }
  return {
    merchantId: env.PAYFAST_SANDBOX_MERCHANT_ID,
    passphrase: env.PAYFAST_SANDBOX_PASSPHRASE
  };
}

export function createPayfastItnHandler({
  env = process.env,
  getOrder = getStoredOrder,
  markOrderPaid = markStoredOrderPaid,
  getSourceIp = platformSourceIp,
  resolveHost = defaultResolveHost,
  fetchImpl = fetch,
  now = () => new Date()
} = {}) {
  return async function payfastItn(event) {
    if (event.httpMethod !== 'POST') {
      return response(405, 'Method not allowed.', { Allow: 'POST' });
    }

    const config = configuration(env);
    if (!config) return response(503, 'Sandbox payment verification is not configured.');

    let fields;
    try {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : event.body || '';
      fields = parseFormBody(body);
    } catch {
      return response(400, 'Invalid notification.');
    }

    const expectedSignature = generateItnSignature(fields, config.passphrase);
    if (!secureEqual(fields.signature, expectedSignature)) {
      return response(400, 'Invalid notification.');
    }

    const order = await getOrder(fields.m_payment_id);
    if (!order) return response(400, 'Invalid notification.');
    if (fields.payment_status !== 'COMPLETE') return response(400, 'Invalid notification.');
    if (fields.merchant_id !== config.merchantId) return response(400, 'Invalid notification.');
    if (!amountMatches(order.amountCents, fields.amount_gross)) {
      return response(400, 'Invalid notification.');
    }

    if (!(await isPayfastSource(getSourceIp(event), resolveHost))) {
      return response(400, 'Invalid notification.');
    }

    const validationBody = parameterString(fields);
    let serverValid = false;
    try {
      const validationResponse = await fetchImpl(sandboxValidateUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: validationBody
      });
      serverValid = (await validationResponse.text()).trim() === 'VALID';
    } catch {
      serverValid = false;
    }
    if (!serverValid) return response(400, 'Invalid notification.');

    await markOrderPaid(order.orderRef, {
      payfastPaymentId: fields.pf_payment_id,
      paymentStatus: fields.payment_status,
      paidAt: now().toISOString()
    });
    return response(200, 'OK');
  };
}

export const handler = createPayfastItnHandler();
