import { createHash } from 'node:crypto';

const PAYMENT_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
  'subscription_notify_email',
  'subscription_notify_webhook',
  'subscription_notify_buyer'
];

function encodeValue(value) {
  return new URLSearchParams([['value', value]])
    .toString()
    .slice('value='.length)
    .replaceAll('*', '%2A');
}

function signPairs(pairs, passphrase) {
  const parts = pairs
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${key}=${encodeValue(String(value).trim())}`);

  if (passphrase !== undefined && passphrase !== null) {
    parts.push(`passphrase=${encodeValue(String(passphrase).trim())}`);
  }

  return createHash('md5').update(parts.join('&'), 'utf8').digest('hex');
}

export function generatePaymentSignature(fields, passphrase) {
  return signPairs(PAYMENT_FIELD_ORDER.map((key) => [key, fields[key]]), passphrase);
}

export function generateItnSignature(fields, passphrase) {
  const pairs = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'signature') break;
    pairs.push([key, value]);
  }
  return signPairs(pairs, passphrase);
}

export function parseFormBody(body) {
  return Object.fromEntries(new URLSearchParams(body));
}

export function amountMatches(expectedCents, amountGross) {
  if (!Number.isSafeInteger(expectedCents) || expectedCents < 0 || typeof amountGross !== 'string') {
    return false;
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(amountGross)) return false;

  const [rand, cents = ''] = amountGross.split('.');
  const receivedCents = Number(rand) * 100 + Number(cents.padEnd(2, '0'));
  return Number.isSafeInteger(receivedCents) && receivedCents === expectedCents;
}

export function sandboxProcessUrl() {
  return 'https://sandbox.payfast.co.za/eng/process';
}

export function sandboxValidateUrl() {
  return 'https://sandbox.payfast.co.za/eng/query/validate';
}
