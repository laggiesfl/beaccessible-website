import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnosticHandler } from '../netlify/functions/payfast-basic-diagnostic.mjs';

const sandboxEnv = {
  PAYFAST_MODE: 'sandbox',
  PAYFAST_SANDBOX_MERCHANT_ID: ' 10000100 ',
  PAYFAST_SANDBOX_MERCHANT_KEY: ' 46f0cd694581a ',
  PAYFAST_SANDBOX_PASSPHRASE: ' fixture passphrase '
};

test('sandbox diagnostic posts only the proven basic PayFast field set plus signature', async () => {
  const handler = createDiagnosticHandler({ env: sandboxEnv });
  const response = await handler({ httpMethod: 'GET' });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /action="https:\/\/sandbox\.payfast\.co\.za\/eng\/process"/);
  assert.match(response.body, /name="merchant_id" value="10000100"/);
  assert.match(response.body, /name="merchant_key" value="46f0cd694581a"/);
  assert.match(response.body, /name="amount" value="3500\.00"/);
  assert.match(response.body, /name="item_name" value="BeAccessible AI Cost Audit"/);
  assert.match(response.body, /name="signature" value="[a-f0-9]{32}"/);
  assert.doesNotMatch(response.body, /return_url|cancel_url|notify_url|m_payment_id|email_address|name_first/);
  assert.doesNotMatch(response.body, /fixture passphrase/);
});

test('diagnostic fails closed outside sandbox', async () => {
  const handler = createDiagnosticHandler({ env: { ...sandboxEnv, PAYFAST_MODE: 'live' } });
  const response = await handler({ httpMethod: 'GET' });
  assert.equal(response.statusCode, 503);
});
