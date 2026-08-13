import { getProduct } from './catalog.mjs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateCheckoutInput(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const value = {
    productCode: textValue(source.productCode),
    name: textValue(source.name),
    email: textValue(source.email),
    organisation: textValue(source.organisation),
    acceptedPolicies: source.acceptedPolicies
  };
  const errors = [];

  if (!getProduct(value.productCode)) {
    errors.push({ field: 'productCode', message: 'Choose an available product.' });
  }

  if (!value.name) {
    errors.push({ field: 'name', message: 'Enter your name.' });
  } else if (value.name.length > 120) {
    errors.push({ field: 'name', message: 'Name must be 120 characters or fewer.' });
  }

  if (!value.email) {
    errors.push({ field: 'email', message: 'Enter your email address.' });
  } else if (value.email.length > 254 || !EMAIL_PATTERN.test(value.email)) {
    errors.push({ field: 'email', message: 'Enter a valid email address.' });
  }

  if (value.organisation.length > 120) {
    errors.push({ field: 'organisation', message: 'Organisation must be 120 characters or fewer.' });
  }

  if (value.acceptedPolicies !== true) {
    errors.push({ field: 'acceptedPolicies', message: 'Accept the purchase and refund policies to continue.' });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value };
}
