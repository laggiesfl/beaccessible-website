import { generatePaymentSignature, sandboxProcessUrl } from './lib/payfast.mjs';
import { createFetchHandler } from './lib/netlify-adapter.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body
  };
}

function formFields(fields) {
  return Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('\n');
}

function signed(fields, passphrase) {
  return { ...fields, signature: generatePaymentSignature(fields, passphrase) };
}

export function createDiagnosticHandler({ env = process.env } = {}) {
  return async function diagnostic(event) {
    if (event.httpMethod !== 'GET') {
      return htmlResponse(405, '<!doctype html><html lang="en"><body><main><h1>Method not allowed</h1></main></body></html>');
    }

    const merchantId = typeof env.PAYFAST_SANDBOX_MERCHANT_ID === 'string'
      ? env.PAYFAST_SANDBOX_MERCHANT_ID.trim()
      : '';
    const merchantKey = typeof env.PAYFAST_SANDBOX_MERCHANT_KEY === 'string'
      ? env.PAYFAST_SANDBOX_MERCHANT_KEY.trim()
      : '';
    const passphrase = typeof env.PAYFAST_SANDBOX_PASSPHRASE === 'string'
      ? env.PAYFAST_SANDBOX_PASSPHRASE.trim()
      : '';

    if (env.PAYFAST_MODE !== 'sandbox' || !merchantId || !merchantKey || !passphrase) {
      return htmlResponse(503, '<!doctype html><html lang="en"><body><main><h1>Sandbox diagnostic unavailable</h1></main></body></html>');
    }

    const requestUrl = event.rawUrl ? new URL(event.rawUrl) : null;
    const baseUrl = requestUrl?.origin || env.DEPLOY_PRIME_URL || env.URL || '';

    const baseFields = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: '3500.00',
      item_name: 'BeAccessible AI Cost Audit'
    };

    const noSignature = { ...baseFields };
    const signatureWithoutPassphrase = {
      ...baseFields,
      signature: generatePaymentSignature(baseFields)
    };
    const signatureWithPassphrase = signed(baseFields, passphrase);

    const callbackFields = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/payment-return.html?order=DIAGNOSTIC-001`,
      cancel_url: `${baseUrl}/payment-cancelled.html?order=DIAGNOSTIC-001`,
      notify_url: `${baseUrl}/.netlify/functions/payfast-itn`,
      amount: '3500.00',
      item_name: 'BeAccessible AI Cost Audit'
    };

    const customerFields = {
      ...callbackFields,
      name_first: 'Diagnostic User',
      email_address: 'diagnostic@example.com'
    };

    const referenceFields = {
      ...customerFields,
      m_payment_id: 'DIAGNOSTIC-001'
    };

    return htmlResponse(200, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PayFast sandbox diagnostic | BeAccessible</title>
<style>
body{font-family:Arial,sans-serif;line-height:1.5;max-width:48rem;margin:2rem auto;padding:0 1rem}button{font:inherit;padding:.8rem 1rem;margin:.5rem 0;min-height:44px}section{margin:1.5rem 0;padding:1rem;border:2px solid #333}code{overflow-wrap:anywhere}
</style>
</head>
<body>
<main>
<h1>PayFast sandbox diagnostic</h1>
<p>These are sandbox test transactions only. No real money will be charged. No Merchant Key, passphrase, or signature is displayed.</p>

<section>
<h2>Test A — no signature</h2>
<p>Basic merchant, amount and item fields only.</p>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(noSignature)}
<button type="submit">Run Test A</button>
</form>
</section>

<section>
<h2>Test B — signature without passphrase</h2>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(signatureWithoutPassphrase)}
<button type="submit">Run Test B</button>
</form>
</section>

<section>
<h2>Test C — signature with Netlify passphrase</h2>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(signatureWithPassphrase)}
<button type="submit">Run Test C</button>
</form>
</section>

<section>
<h2>Test D — add callback URLs</h2>
<p>Adds return, cancellation and notification URLs to the working Test C field set.</p>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(signed(callbackFields, passphrase))}
<button type="submit">Run Test D</button>
</form>
</section>

<section>
<h2>Test E — add customer details</h2>
<p>Adds a test name and email address to Test D.</p>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(signed(customerFields, passphrase))}
<button type="submit">Run Test E</button>
</form>
</section>

<section>
<h2>Test F — add merchant payment reference</h2>
<p>Adds the merchant payment ID used to match a PayFast transaction to an order.</p>
<form action="${sandboxProcessUrl()}" method="post" target="_blank">
${formFields(signed(referenceFields, passphrase))}
<button type="submit">Run Test F</button>
</form>
</section>
</main>
</body>
</html>`);
  };
}

const handler = createDiagnosticHandler();
export default createFetchHandler(handler);
