import { getProduct } from './lib/catalog.mjs';
import { createPendingOrder as createStoredPendingOrder } from './lib/orders.mjs';
import { generatePaymentSignature, parseFormBody, sandboxProcessUrl } from './lib/payfast.mjs';
import { validateCheckoutInput } from './lib/validation.mjs';

const POLICY_VERSION = '2026-08-13';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body
  };
}

function errorPage(messages, statusCode = 400, extraHeaders = {}) {
  const items = messages.map((message) => `<li>${escapeHtml(message)}</li>`).join('');
  return htmlResponse(statusCode, `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Payment could not start | BeAccessible</title></head>
<body><main><h1>Payment could not start</h1><div role="alert"><p>A successful payment has not been confirmed.</p><ul>${items}</ul></div><p><a href="/checkout-ai-cost-audit.html">Return to payment review</a></p></main></body>
</html>`, extraHeaders);
}

function validationErrorPage(errors, value) {
  const items = errors
    .map(({ field, message }) => `<li><a href="#${escapeHtml(field)}">${escapeHtml(message)}</a></li>`)
    .join('');
  const checked = value.acceptedPolicies === true ? ' checked' : '';
  return htmlResponse(400, `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Check your payment details | BeAccessible</title></head>
<body><main>
  <h1>Check your payment details</h1>
  <div id="error-summary" role="alert" tabindex="-1"><p>A successful payment has not been confirmed. Correct the following details:</p><ul>${items}</ul></div>
  <form action="/.netlify/functions/start-payment" method="post">
    <input type="hidden" name="productCode" value="${escapeHtml(value.productCode)}">
    <p><label for="name">Name</label><br><input id="name" name="name" autocomplete="name" required maxlength="120" value="${escapeHtml(value.name)}"></p>
    <p><label for="email">Email</label><br><input id="email" name="email" type="email" autocomplete="email" required maxlength="254" value="${escapeHtml(value.email)}"></p>
    <p><label for="organisation">Organisation (optional)</label><br><input id="organisation" name="organisation" autocomplete="organization" maxlength="120" value="${escapeHtml(value.organisation)}"></p>
    <p><input id="acceptedPolicies" name="acceptedPolicies" type="checkbox" required${checked}> <label for="acceptedPolicies">I accept the <a href="/terms.html">Terms and Conditions</a> and <a href="/refund-cancellation-delivery.html">Refund, Cancellation and Delivery Policy</a>.</label></p>
    <button type="submit">Continue to secure payment</button>
  </form>
  <p><a href="/products.html">Cancel and return to products</a></p>
</main><script>document.getElementById('error-summary').focus();</script></body>
</html>`);
}

function contentType(headers = {}) {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === 'content-type');
  return entry?.[1]?.split(';', 1)[0].trim().toLowerCase() ?? '';
}

function parseInput(event) {
  const type = contentType(event.headers);
  if (type === 'application/json') return JSON.parse(event.body || '{}');
  if (type === 'application/x-www-form-urlencoded') {
    const parsed = parseFormBody(event.body || '');
    return { ...parsed, acceptedPolicies: parsed.acceptedPolicies === 'on' };
  }
  return {};
}

function sandboxConfig(env, event) {
  const baseUrl = env.DEPLOY_PRIME_URL || env.URL || event.rawUrl;
  if (
    env.PAYFAST_MODE !== 'sandbox' ||
    !env.PAYFAST_SANDBOX_MERCHANT_ID ||
    !env.PAYFAST_SANDBOX_MERCHANT_KEY ||
    !env.PAYFAST_SANDBOX_PASSPHRASE ||
    !baseUrl
  ) {
    return null;
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') return null;
    if (!env.DEPLOY_PRIME_URL && !env.URL && !url.hostname.endsWith('.netlify.app')) return null;
    return {
      baseUrl: url.origin,
      merchantId: env.PAYFAST_SANDBOX_MERCHANT_ID,
      merchantKey: env.PAYFAST_SANDBOX_MERCHANT_KEY,
      passphrase: env.PAYFAST_SANDBOX_PASSPHRASE
    };
  } catch {
    return null;
  }
}

function paymentPage(fields) {
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Continue to secure payment | BeAccessible</title>
</head>
<body>
  <main>
    <h1>Continue to Payfast Sandbox</h1>
    <p>You are moving to Payfast Sandbox to complete a test payment. No real money will be charged.</p>
    <form id="payfast-form" action="${sandboxProcessUrl()}" method="post">
      ${inputs}
      <button type="submit">Continue to Payfast Sandbox</button>
    </form>
    <p><a href="/payment-cancelled.html">Cancel and return to BeAccessible</a></p>
  </main>
  <script>document.getElementById('payfast-form').submit();</script>
</body>
</html>`;
}

export function createStartPaymentHandler({
  env = process.env,
  createPendingOrder = createStoredPendingOrder
} = {}) {
  return async function startPayment(event) {
    if (event.httpMethod !== 'POST') {
      return errorPage(['Use the payment review form to continue.'], 405, { Allow: 'POST' });
    }

    let submitted;
    try {
      submitted = parseInput(event);
    } catch {
      return errorPage(['The submitted payment details could not be read.']);
    }

    const input = {
      productCode: submitted.productCode,
      name: submitted.name,
      email: submitted.email,
      organisation: submitted.organisation,
      acceptedPolicies: submitted.acceptedPolicies
    };
    const validation = validateCheckoutInput(input);
    if (!validation.ok) {
      return validationErrorPage(validation.errors, {
        productCode: typeof input.productCode === 'string' ? input.productCode.trim() : '',
        name: typeof input.name === 'string' ? input.name.trim() : '',
        email: typeof input.email === 'string' ? input.email.trim() : '',
        organisation: typeof input.organisation === 'string' ? input.organisation.trim() : '',
        acceptedPolicies: input.acceptedPolicies
      });
    }

    const product = getProduct(validation.value.productCode);
    const config = sandboxConfig(env, event);
    if (!product || !config) {
      return errorPage(['Payfast Sandbox is not configured. Please try again later.'], 503);
    }

    let order;
    try {
      order = await createPendingOrder({
        product,
        customer: {
          name: validation.value.name,
          email: validation.value.email,
          organisation: validation.value.organisation
        },
        policyVersion: POLICY_VERSION
      });
    } catch {
      return errorPage(['The pending order could not be created. Please try again later.'], 503);
    }

    const fields = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: `${config.baseUrl}/payment-return.html?order=${encodeURIComponent(order.orderRef)}`,
      cancel_url: `${config.baseUrl}/payment-cancelled.html?order=${encodeURIComponent(order.orderRef)}`,
      notify_url: `${config.baseUrl}/.netlify/functions/payfast-itn`,
      name_first: validation.value.name,
      email_address: validation.value.email,
      m_payment_id: order.orderRef,
      amount: (product.amountCents / 100).toFixed(2),
      item_name: product.name
    };
    fields.signature = generatePaymentSignature(fields, config.passphrase);

    return htmlResponse(200, paymentPage(fields));
  };
}

export const handler = createStartPaymentHandler();
