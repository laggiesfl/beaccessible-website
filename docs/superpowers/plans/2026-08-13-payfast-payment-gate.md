# Payfast Payment Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an accessible, sandbox-only Payfast checkout for the BeAccessible AI Cost Audit at R3,500 once-off, with verified payment notification, durable sandbox order records, cancellation/return pages and no live charging.

**Architecture:** Keep the existing static BeAccessible site intact and add a narrowly scoped checkout subsystem. Static HTML provides the offer/review/return/cancel experience; Netlify Functions own product/price validation, order creation, Payfast signature generation and ITN verification; Netlify Blobs stores sandbox order state. The browser never supplies the authoritative product amount, and fulfilment never starts from the return page alone.

**Tech Stack:** Existing static HTML/CSS; Node.js 24; Netlify Functions; `@netlify/blobs`; Node built-in `node:test`; Payfast Custom Integration Sandbox.

## Global Constraints

- First offer: **BeAccessible AI Cost Audit**.
- Price: **R3,500 once-off**.
- Scope: up to 10 AI tools; up to 3 stakeholder/user interviews where required; cost, duplication, accessibility, usability, privacy and governance review; per-tool recommendations; 30-day action plan; 90-day optimisation/governance plan; human-reviewed accessible DOCX/PDF report.
- Delivery: **within 5 working days after all required customer information and evidence have been received**.
- BiasLens remains invitation-only and outside public checkout.
- UDL remains outside Payfast while Pro is publicly free during beta.
- First implementation is **Payfast Sandbox only**. Live charging remains disabled.
- Payfast passphrase and any private storage credentials must exist only in protected hosting configuration.
- The authoritative product price is server-side; reject any unknown product code.
- The return page alone is never proof of payment.
- Fulfilment starts only after verified ITN changes an order to paid.
- Target **WCAG 2.2 AA minimum**, applying AAA criteria where reasonably achievable.
- No drag-only action, no rapid pointer/finger-release requirement, no unnecessary time limit, and no colour-only status communication.

---

## File Structure

**Create**
- `package.json` — scripts and the single runtime dependency `@netlify/blobs`.
- `netlify/functions/lib/catalog.mjs` — authoritative product catalogue and R3,500 amount.
- `netlify/functions/lib/validation.mjs` — customer/order validation and normalisation.
- `netlify/functions/lib/payfast.mjs` — Payfast form-field ordering, URL encoding and signature/notification helpers.
- `netlify/functions/lib/orders.mjs` — Netlify Blobs order create/read/update helpers.
- `netlify/functions/start-payment.mjs` — validates checkout request, creates pending order and returns a sandbox Payfast form response.
- `netlify/functions/payfast-itn.mjs` — verifies ITN and changes the matching order to paid only when all checks pass.
- `ai-cost-audit.html` — fixed commercial offer page.
- `checkout-ai-cost-audit.html` — accessible customer review/acceptance form.
- `payment-return.html` — neutral confirmation/pending page.
- `payment-cancelled.html` — clear cancelled checkout page.
- `payment-status.js` — reads public order status endpoint or displays pending guidance without treating URL arrival as proof.
- `netlify/functions/order-status.mjs` — exposes only safe customer-facing payment status for a valid order reference.
- `tests/catalog.test.mjs`
- `tests/validation.test.mjs`
- `tests/payfast.test.mjs`
- `tests/orders.test.mjs`
- `tests/start-payment.test.mjs`
- `tests/payfast-itn.test.mjs`
- `tests/order-status.test.mjs`

**Modify**
- `products.html` — change AI Cost Audit action from Enquire to a sandbox-preview CTA only on the Phase 3 branch.
- `styles.css` — add reusable checkout/form/error/status styles using existing BeAccessible tokens.
- `netlify.toml` — declare Node 24 functions directory and keep existing security headers/build transformation.

---

### Task 1: Authoritative Product Catalogue and Input Validation

**Files:**
- Create: `package.json`
- Create: `netlify/functions/lib/catalog.mjs`
- Create: `netlify/functions/lib/validation.mjs`
- Test: `tests/catalog.test.mjs`
- Test: `tests/validation.test.mjs`

**Interfaces:**
- Produces: `getProduct(productCode: string): Product | null`
- Produces: `validateCheckoutInput(input: unknown): { ok: true, value: CheckoutInput } | { ok: false, errors: FieldError[] }`
- `Product` fields: `{ code, name, amountCents, currency, billing, deliveryText, scopeSummary }`
- `CheckoutInput` fields: `{ productCode, name, email, organisation, acceptedPolicies }`

- [ ] **Step 1: Create `package.json` with test and runtime dependency declarations**

```json
{
  "private": true,
  "type": "module",
  "engines": { "node": "24.x" },
  "scripts": { "test": "node --test tests/*.test.mjs" },
  "dependencies": { "@netlify/blobs": "^10.0.0" }
}
```

Before implementation, confirm the current compatible `@netlify/blobs` major in Netlify’s official docs and use that current supported major if it differs.

- [ ] **Step 2: Write failing catalogue tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getProduct } from '../netlify/functions/lib/catalog.mjs';

test('AI Cost Audit is authoritative at R3500 ZAR once-off', () => {
  const product = getProduct('ai-cost-audit');
  assert.equal(product.amountCents, 350000);
  assert.equal(product.currency, 'ZAR');
  assert.equal(product.billing, 'once-off');
});

test('unknown products are rejected', () => {
  assert.equal(getProduct('biaslens'), null);
  assert.equal(getProduct('udl-pro'), null);
});
```

- [ ] **Step 3: Run catalogue tests and verify RED**

Run: `npm test -- tests/catalog.test.mjs`
Expected: FAIL because `catalog.mjs` does not exist.

- [ ] **Step 4: Implement minimal authoritative catalogue**

```js
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
```

- [ ] **Step 5: Run catalogue tests and verify GREEN**

Run: `npm test -- tests/catalog.test.mjs`
Expected: PASS.

- [ ] **Step 6: Write failing validation tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCheckoutInput } from '../netlify/functions/lib/validation.mjs';

test('valid checkout input is normalised', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit',
    name: '  Test Customer  ',
    email: 'customer@example.com',
    organisation: 'Example Org',
    acceptedPolicies: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, 'Test Customer');
});

test('invalid email is rejected', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit', name: 'Test', email: 'not-an-email', organisation: '', acceptedPolicies: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.field === 'email'));
});

test('policy acceptance is required', () => {
  const result = validateCheckoutInput({
    productCode: 'ai-cost-audit', name: 'Test', email: 'customer@example.com', organisation: '', acceptedPolicies: false
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.field === 'acceptedPolicies'));
});
```

- [ ] **Step 7: Run validation tests and verify RED**

Run: `npm test -- tests/validation.test.mjs`
Expected: FAIL because `validation.mjs` does not exist.

- [ ] **Step 8: Implement minimal validation**

Use trimming, a conservative email format check, a maximum length of 120 characters for name/organisation, maximum 254 for email, exact allow-listed product code, and required boolean `acceptedPolicies === true`. Return field-specific plain-language errors.

- [ ] **Step 9: Run all Task 1 tests**

Run: `npm test -- tests/catalog.test.mjs tests/validation.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 10: Commit Task 1**

```bash
git add package.json netlify/functions/lib/catalog.mjs netlify/functions/lib/validation.mjs tests/catalog.test.mjs tests/validation.test.mjs
git commit -m "feat: add authoritative checkout catalogue and validation"
```

---

### Task 2: Payfast Sandbox Signature and Notification Helpers

**Files:**
- Create: `netlify/functions/lib/payfast.mjs`
- Test: `tests/payfast.test.mjs`

**Interfaces:**
- Produces: `generatePaymentSignature(fields: Record<string,string>, passphrase?: string): string`
- Produces: `generateItnSignature(fields: Record<string,string>, passphrase?: string): string`
- Produces: `parseFormBody(body: string): Record<string,string>`
- Produces: `amountMatches(expectedCents: number, amountGross: string): boolean`
- Produces: `sandboxProcessUrl(): string`
- Produces: `sandboxValidateUrl(): string`

- [ ] **Step 1: Write failing encoding/signature tests using Payfast’s documented field order**

Use a fixed fixture with merchant/customer/order fields and a fixed passphrase. Assert the exact MD5 output calculated from the documented Payfast Custom Integration rules. Keep the fixture non-secret and sandbox-only.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/payfast.test.mjs`
Expected: FAIL because `payfast.mjs` does not exist.

- [ ] **Step 3: Implement payment-signature helper**

Implementation requirements:
- ignore blank values;
- preserve the documented Payfast payment field order rather than sorting alphabetically;
- trim values;
- use application/x-www-form-urlencoded encoding with spaces as `+`;
- append the passphrase only when supplied;
- MD5 the final encoded string;
- never log the passphrase.

- [ ] **Step 4: Implement ITN-signature and form parser helpers**

The ITN helper must reproduce Payfast’s ITN posted-field sequence up to but excluding `signature`, then apply the passphrase when configured.

- [ ] **Step 5: Add amount mismatch tests**

```js
test('R3500 matches amount_gross 3500.00', () => {
  assert.equal(amountMatches(350000, '3500.00'), true);
});

test('R3500 rejects amount_gross 35.00', () => {
  assert.equal(amountMatches(350000, '35.00'), false);
});
```

- [ ] **Step 6: Run Payfast tests and verify GREEN**

Run: `npm test -- tests/payfast.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 7: Commit Task 2**

```bash
git add netlify/functions/lib/payfast.mjs tests/payfast.test.mjs
git commit -m "feat: add Payfast sandbox signing helpers"
```

---

### Task 3: Durable Sandbox Order Store

**Files:**
- Create: `netlify/functions/lib/orders.mjs`
- Test: `tests/orders.test.mjs`

**Interfaces:**
- Produces: `createPendingOrder({ product, customer, policyVersion }): Promise<Order>`
- Produces: `getOrder(orderRef: string): Promise<Order | null>`
- Produces: `markOrderPaid(orderRef: string, payment: PaymentRecord): Promise<{ changed: boolean, order: Order }>`
- `Order.status`: `'pending' | 'paid' | 'cancelled' | 'verification_failed'`
- `Order.fulfilmentStatus`: `'not_started' | 'intake_sent' | 'in_progress' | 'delivered'`

- [ ] **Step 1: Write failing order-reference and state-transition tests**

Test that new references match `BA-YYYYMMDD-<random>`; new orders are `pending`; the stored amount is 350000 cents; first `markOrderPaid` changes state; a second identical call returns `changed: false` and leaves state paid.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/orders.test.mjs`
Expected: FAIL because `orders.mjs` does not exist.

- [ ] **Step 3: Implement storage adapter with injectable store**

Production uses `getStore('beaccessible-orders')` from `@netlify/blobs`. Tests inject an in-memory store implementing `get`, `set` and `getWithMetadata`-compatible behaviour so tests do not contact Netlify.

Persist only the minimum required order/customer/payment state. Do not store card data.

- [ ] **Step 4: Implement idempotent paid transition**

If the order is already paid, return `{ changed: false, order }`; do not reset fulfilment fields and do not emit a second fulfilment signal.

- [ ] **Step 5: Run order tests and verify GREEN**

Run: `npm test -- tests/orders.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit Task 3**

```bash
git add netlify/functions/lib/orders.mjs tests/orders.test.mjs
git commit -m "feat: persist sandbox checkout orders"
```

---

### Task 4: Start-Payment Function

**Files:**
- Create: `netlify/functions/start-payment.mjs`
- Test: `tests/start-payment.test.mjs`

**Interfaces:**
- Consumes: `getProduct`, `validateCheckoutInput`, `createPendingOrder`, `generatePaymentSignature`
- Produces HTTP response: status 200 with accessible HTML that auto-submits a signed form to Payfast Sandbox, plus a visible manual **Continue to Payfast Sandbox** fallback button.

- [ ] **Step 1: Write failing unknown-product and tampered-amount tests**

The public request body may contain only `productCode`, customer fields and policy acceptance. Even if an extra `amount=1` is supplied, the function must render `3500.00` from the server catalogue.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/start-payment.test.mjs`
Expected: FAIL because the function does not exist.

- [ ] **Step 3: Implement request validation and order creation**

Accept POST only. Parse JSON or form data. Validate input. Resolve `ai-cost-audit` from the authoritative catalogue. Create a pending order with policy version `2026-08-13`.

- [ ] **Step 4: Implement sandbox Payfast form response**

Use environment variables for sandbox merchant configuration and passphrase. Required Payfast fields include merchant details, return/cancel/notify URLs, customer fields, unique `m_payment_id`, exact `amount=3500.00`, item name and server-generated signature.

The HTML response must:
- include `<title>Continue to secure payment | BeAccessible</title>`;
- announce that the user is moving to Payfast Sandbox;
- contain a visible submit fallback rather than relying solely on JavaScript;
- not display or log the passphrase;
- include no live Payfast process URL while sandbox mode is active.

- [ ] **Step 5: Run start-payment tests and verify GREEN**

Run: `npm test -- tests/start-payment.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 6: Commit Task 4**

```bash
git add netlify/functions/start-payment.mjs tests/start-payment.test.mjs
git commit -m "feat: start signed Payfast sandbox payments"
```

---

### Task 5: Payfast ITN Verification and Paid State

**Files:**
- Create: `netlify/functions/payfast-itn.mjs`
- Test: `tests/payfast-itn.test.mjs`

**Interfaces:**
- Consumes: `parseFormBody`, `generateItnSignature`, `amountMatches`, `getOrder`, `markOrderPaid`
- Produces: HTTP 200 only after the notification body is processed; invalid verification never marks an order paid.

- [ ] **Step 1: Write failing invalid-signature, unknown-order and amount-mismatch tests**

Each case must leave the order `pending`.

- [ ] **Step 2: Write failing valid-notification test**

A valid sandbox notification for the matching `m_payment_id`, `payment_status=COMPLETE`, matching signature and `amount_gross=3500.00` changes the order once from `pending` to `paid`.

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test -- tests/payfast-itn.test.mjs`
Expected: FAIL because the ITN function does not exist.

- [ ] **Step 4: Implement local checks**

Reject unless:
- signature matches;
- order exists;
- status is `COMPLETE`;
- received gross amount matches the stored order amount;
- merchant identifier matches configured sandbox merchant identifier.

- [ ] **Step 5: Implement Payfast server validation call**

POST the received parameter string to Payfast’s documented **Sandbox transaction notification validation URL**. Accept only the documented successful response. Keep this HTTP call injectable in tests.

- [ ] **Step 6: Implement Payfast source/domain validation according to current official ITN guidance**

Resolve/validate the documented Payfast sandbox/live hostnames on the server side using the current official Payfast rules. Keep DNS/source lookup injectable for deterministic tests. Do not use a customer-controlled header alone as proof of source.

- [ ] **Step 7: Implement idempotent paid transition**

Only after every check succeeds call `markOrderPaid`. A duplicate valid notification must keep the order paid and return successfully without creating a second fulfilment event.

- [ ] **Step 8: Run ITN tests and verify GREEN**

Run: `npm test -- tests/payfast-itn.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 9: Commit Task 5**

```bash
git add netlify/functions/payfast-itn.mjs tests/payfast-itn.test.mjs
git commit -m "feat: verify Payfast sandbox notifications"
```

---

### Task 6: Accessible Offer and Checkout Review UI

**Files:**
- Create: `ai-cost-audit.html`
- Create: `checkout-ai-cost-audit.html`
- Modify: `styles.css`
- Modify: `products.html`

**Interfaces:**
- Checkout form posts to `/.netlify/functions/start-payment`.
- Fixed hidden `productCode` is `ai-cost-audit`.
- Required fields: name, email, policy acceptance.
- Optional field: organisation.

- [ ] **Step 1: Add AI Cost Audit offer page**

The page must state exactly:
- `R3,500 once-off`;
- up to 10 AI tools;
- up to 3 stakeholder/user interviews where required;
- the audit areas and deliverables from Global Constraints;
- delivery within 5 working days **after all required information/evidence is received**;
- a clear link to `checkout-ai-cost-audit.html` labelled **Review and proceed to payment**;
- legal/accessibility links in the footer.

- [ ] **Step 2: Add checkout review form with semantic fieldset/error hooks**

Use a single-column form with:
- `label` elements for every input;
- input autocomplete tokens (`name`, `email`, `organization`);
- an unticked required checkbox whose label links to Terms and Refund/Cancellation/Delivery;
- a concise refund/delivery summary before acceptance;
- one primary submit action **Continue to secure payment**;
- one secondary link **Cancel and return to products**;
- an empty `role="alert"` error-summary container with focus target `tabindex="-1"`.

- [ ] **Step 3: Add client-side enhancement without making JavaScript mandatory for policy meaning**

Use browser constraint validation only as enhancement. On invalid submission, populate the error summary, preserve values, move focus to the summary, and provide links/focus movement to affected fields. Server validation remains authoritative.

- [ ] **Step 4: Add accessible checkout styles**

Reuse existing colours. Minimum interactive target height: 44px; visible 3px focus outline with sufficient contrast; max text width approximately 70 characters; error state uses icon/text plus colour; `prefers-reduced-motion: reduce` disables nonessential transitions; layout reflows to one column without horizontal scrolling.

- [ ] **Step 5: Change Phase 3 branch catalogue CTA only**

On `products.html`, AI Cost Audit changes from **Enquire** to **View AI Cost Audit — R3,500** linking to `ai-cost-audit.html`. Do not change BiasLens, UDL or demonstration CTAs.

- [ ] **Step 6: Manually inspect source for required accessibility markers**

Run searches verifying: skip link, `main`, one `h1`, associated labels, required checkbox, descriptive links, `role="alert"`, no `autofocus`, no time limit, no disabled submit based solely on client-side state.

- [ ] **Step 7: Commit Task 6**

```bash
git add ai-cost-audit.html checkout-ai-cost-audit.html styles.css products.html
git commit -m "feat: add accessible AI Cost Audit checkout review"
```

---

### Task 7: Return, Cancellation and Safe Order Status

**Files:**
- Create: `payment-return.html`
- Create: `payment-cancelled.html`
- Create: `payment-status.js`
- Create: `netlify/functions/order-status.mjs`
- Test: `tests/order-status.test.mjs`

**Interfaces:**
- `GET /.netlify/functions/order-status?order=<ref>` returns only `{ orderRef, paymentStatus, fulfilmentStatus }` for a valid order, never customer email/name or payment secrets.

- [ ] **Step 1: Write failing safe-status tests**

Test unknown order 404; pending order response; paid order response; response excludes customer name/email and raw Payfast data.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/order-status.test.mjs`
Expected: FAIL because endpoint does not exist.

- [ ] **Step 3: Implement safe status endpoint**

Validate order-reference format before lookup. Return `Cache-Control: no-store`. Expose only order reference and coarse payment/fulfilment states.

- [ ] **Step 4: Run status tests and verify GREEN**

Run: `npm test -- tests/order-status.test.mjs`
Expected: PASS.

- [ ] **Step 5: Implement return page**

Copy must say that reaching the page does not by itself confirm payment; show the order reference when present; use `payment-status.js` to query status and announce changes through `aria-live="polite"`; if pending, explain that confirmation may take a moment and provide contact support without implying failure.

- [ ] **Step 6: Implement cancellation page**

State clearly: checkout was cancelled; the page does not record a successful payment; provide links back to AI Cost Audit and Products; provide support email.

- [ ] **Step 7: Commit Task 7**

```bash
git add payment-return.html payment-cancelled.html payment-status.js netlify/functions/order-status.mjs tests/order-status.test.mjs
git commit -m "feat: add safe payment status and return pages"
```

---

### Task 8: Netlify Configuration, Sandbox Environment and Full Verification

**Files:**
- Modify: `netlify.toml`
- Modify: `.gitignore` if needed
- Create: `.env.example` with names only, no values/secrets

**Interfaces:**
- Netlify Functions directory: `netlify/functions`.
- Runtime mode remains `sandbox`.

- [ ] **Step 1: Update Netlify configuration without disturbing Phase 2 build transformation**

Keep:

```toml
[build]
  command = "python3 scripts/apply_phase2_homepage.py"
  publish = "."
```

Add only the function/runtime configuration required by current Netlify docs. Preserve existing security headers.

- [ ] **Step 2: Add `.env.example` with variable names only**

Include sandbox-mode, merchant configuration and passphrase variable names, but no real values. The code must fail closed if required sandbox configuration is missing.

- [ ] **Step 3: Run the full automated test suite**

Run: `npm test`
Expected: all tests PASS, 0 failures.

- [ ] **Step 4: Run Netlify build locally or through branch deploy**

Expected: Phase 2 homepage transformation succeeds; Functions bundle successfully; static pages publish successfully.

- [ ] **Step 5: Trigger a Phase 3 branch deploy and inspect build log**

Use the existing trusted-hook pattern, creating a dedicated hook for `phase-3-payfast-gate` only if Netlify’s contributor restriction blocks normal branch deploy. Do not expose the hook URL in chat or repository.

Expected: green Branch Deploy for `phase-3-payfast-gate`.

- [ ] **Step 6: Manual accessibility verification on branch deploy**

Complete the journey using keyboard only. Verify:
- skip link;
- visible focus throughout;
- no trapped focus;
- 200% and 400% zoom/reflow without horizontal page scrolling at standard narrow viewport;
- labels announced by screen reader;
- policy checkbox is unticked by default;
- invalid form produces understandable error summary and preserves inputs;
- no action requires fast finger/pointer release;
- return/cancel status is conveyed in text, not colour alone.

- [ ] **Step 7: Run Payfast Sandbox transaction**

Use the Payfast Sandbox only. Verify:
- displayed amount is R3,500;
- Payfast receives `3500.00`;
- ITN is received and verified;
- order transitions pending → paid once;
- return page eventually announces paid status;
- no real money changes hands.

- [ ] **Step 8: Verify tampering and failure paths**

Test unknown product, altered browser amount, invalid signature fixture, amount mismatch fixture, cancelled checkout and duplicate ITN fixture. Expected: none can create a second fulfilment transition or falsely mark an unpaid order paid.

- [ ] **Step 9: Commit Task 8**

```bash
git add netlify.toml .env.example .gitignore
git commit -m "chore: configure Payfast sandbox branch deployment"
```

- [ ] **Step 10: Open a draft Phase 3 PR only after verification evidence is captured**

PR title: `Phase 3: Payfast sandbox payment gate`

PR body must explicitly state:
- sandbox only;
- AI Cost Audit only;
- R3,500 once-off;
- no live merchant activation;
- verification/test evidence;
- known limitations;
- live activation requires a separate approval and production-readiness gate.

---

## Self-Review Results

- **Spec coverage:** Every design requirement maps to Tasks 1–8, including authoritative pricing, policy acceptance, server-side signing, ITN verification, amount checks, idempotency, durable sandbox storage, accessible review/return/cancel UI and sandbox-only deployment.
- **Scope:** Restricted to one once-off AI Cost Audit checkout. Subscriptions, UDL, BiasLens checkout, carts, coupons, multi-currency and automated refunds remain excluded.
- **Type/interface consistency:** `productCode = ai-cost-audit`; amount is consistently stored as `350000` cents and formatted to `3500.00` for Payfast; order state names are consistent across storage, ITN and status endpoint.
- **No unresolved implementation placeholders:** Live merchant values are intentionally external configuration and are not implementation placeholders; sandbox configuration must be provided securely at execution time.
- **Security limitation acknowledged:** Netlify Blobs is suitable for the sandbox order record, but its last-write-wins model is not a transactional database. Before live automated fulfilment at scale, re-evaluate whether the order store should move to a transactional database or add stronger concurrency control.

---

**Accessibility Compliance Note:** The implementation plan targets WCAG 2.2 AA minimum and applies Universal Design principles throughout. It includes semantic structure, keyboard operation, visible focus, meaningful labels, accessible error recovery, text-based status, large targets, responsive reflow, reduced motion, no unnecessary time limits and specific tolerance for slower one-handed motor interaction.