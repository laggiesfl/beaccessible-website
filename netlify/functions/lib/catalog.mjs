const products = new Map([
  ['ai-cost-audit', {
    code: 'ai-cost-audit',
    name: 'BeAccessible AI Cost Audit',
    amountCents: 350000,
    currency: 'ZAR',
    billing: 'once-off',
    deliveryText: 'Within 5 working days after all required customer information and evidence have been received.',
    scopeSummary: 'Review of up to 10 AI tools, including cost, duplication, accessibility, usability, privacy and governance, with a human-reviewed accessible report.'
  }]
]);

export function getProduct(productCode) {
  return products.get(productCode) ?? null;
}
