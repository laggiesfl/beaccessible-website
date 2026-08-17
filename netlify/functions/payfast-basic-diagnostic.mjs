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

    const fields = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: '3500.00',
      item_name: 'BeAccessible AI Cost Audit'
    };
    fields.signature = generatePaymentSignature(fields, passphrase);

    const inputs = Object.entries(fields)
      .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
      .join('\n');

    return htmlResponse(200, `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PayFast sandbox diagnostic</title></head>
<body>
<main>
<h1>PayFast sandbox diagnostic</h1>
<p>This temporary diagnostic sends the same basic field set that succeeded in PayFast's integration tester. No real money is charged.</p>
<form id="payfast-diagnostic" action="${sandboxProcessUrl()}" method="post">
${inputs}
<button type="submit">Continue to PayFast Sandbox</button>
</form>
</main>
<script>document.getElementById('payfast-diagnostic').submit();</script>
</body>
</html>`);
  };
}

const handler = createDiagnosticHandler();
export default createFetchHandler(handler);
