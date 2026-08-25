# BeAccessible Payfast Payment Gate — Design Specification

**Date:** 13 August 2026
**Branch:** `phase-3-payfast-gate`

## Approved first offer

The first payment pilot is the **BeAccessible AI Cost Audit**.

- Price: **R3,500 once-off**.
- Scope: review of up to 10 AI tools; up to 3 stakeholder/user interviews where required; cost, duplication, accessibility, usability, privacy and governance review; per-tool recommendations; 30-day action plan; 90-day optimisation/governance plan; human-reviewed accessible DOCX/PDF report.
- Delivery: **within 5 working days after all required customer information and evidence have been received**.

BiasLens remains invitation-only. UDL remains outside Payfast while its Pro tier is publicly free during beta. Demonstrations, pilots and quotation-based work remain outside direct checkout.

The detailed commercial classification is governed by `docs/phase-3-product-price-delivery-matrix.md` and `docs/phase-3-pricing-validation.md`.

## Customer journey

`AI Cost Audit offer → BeAccessible payment review → customer details + unticked policy acceptance → Continue to secure payment → Payfast sandbox → payment notification verification → confirmation → accessible intake instructions → audit workflow → human approval → accessible report delivery`.

The customer returning to the site after payment is not treated by itself as proof of payment. Fulfilment begins only after the payment notification has been verified.

## Payment review page

The review page will show, before the customer proceeds:

- product name;
- exact ZAR price;
- once-off billing status;
- included scope and limits;
- customer information required to start the audit;
- five-working-day delivery timing and when that period starts;
- refund/cancellation summary;
- Terms & Conditions link;
- Refund, Cancellation & Delivery link;
- Privacy Policy link;
- Accessibility Statement link;
- required unticked acceptance checkbox;
- customer name and email fields;
- optional organisation field;
- one primary action: **Continue to secure payment**;
- one secondary action: **Cancel and return to products**.

BeAccessible will not collect payment-card information on its own website.

## Technical components

The Phase 3 preview will add a small, isolated payment subsystem:

1. **AI Cost Audit offer page** — explains the commercial package.
2. **Payment review page** — validates customer input and policy acceptance.
3. **Payment initiation function** — accepts only approved product codes and uses the authoritative product price rather than any browser-supplied amount.
4. **Payment notification function** — verifies the payment notification before marking an order paid.
5. **Payment return page** — explains confirmation status and next steps without granting fulfilment merely because the page was reached.
6. **Payment cancelled page** — clearly states that checkout was cancelled.
7. **Order record** — stores order reference, product, amount, customer, accepted policy version, payment state and fulfilment state.

The sandbox implementation may be reviewed before the final durable order store is activated, but live charging cannot be enabled until durable order storage exists.

## Error handling

- Invalid fields produce a plain-language error summary linked to each affected field.
- Existing valid input is preserved after an error.
- Focus moves to the error summary after unsuccessful validation.
- Payment-start failures say clearly that no successful charge has been confirmed and provide retry/contact options.
- Failed payment verification leaves the order unpaid and unfulfilled.
- Duplicate payment notifications cannot duplicate fulfilment.
- Cancellation does not display success language.

## Accessibility and Universal Design

Target **WCAG 2.2 AA minimum**, applying AAA criteria where reasonably achievable.

The flow must include semantic structure, full keyboard use, visible focus, properly associated labels, clear instructions, large and well-spaced targets, no colour-only information, accessible errors, no unnecessary time limits, reduced-motion support, responsive reflow, meaningful action labels and screen-reader-compatible status information.

The checkout must specifically tolerate slower motor interaction: no drag-only controls, no action requiring rapid pointer/finger release, and no unnecessary precision or repeated activation.

The visual design will follow the existing BeAccessible deep-blue, mid-blue, soft-blue, white and light-tint palette, using a simple single-column checkout to minimise physical and cognitive effort.

## Test requirements

Payment logic will be developed test-first. Tests must cover at minimum:

- unknown product rejection;
- authoritative R3,500 price for the AI Cost Audit;
- invalid customer email;
- required policy acceptance;
- unique order reference generation;
- known test payment-signature generation;
- invalid notification rejection;
- amount mismatch rejection;
- duplicate notification protection;
- one-time transition to paid after valid sandbox verification.

Manual checks must cover keyboard-only use, focus visibility, screen-reader labels/status, error recovery, zoom/reflow and slower touch/pointer release.

## Sandbox gate

The first implementation is sandbox-only. Real charging stays disabled until the payment flow, cancellation path, verification, amount checking, duplicate protection, durable order storage, confirmation route, legal wording and accessibility checks all pass.

## Out of scope for the first release

Recurring subscriptions, UDL paid checkout during beta, BiasLens public checkout, multi-currency, coupons, multi-product carts, customer accounts and automated refunds are excluded.

---

**Accessibility Compliance Note:** WCAG 2.2 AA is the minimum design target. The flow applies Universal Design principles including equitable use, perceptible information, tolerance for error, low physical effort and appropriate target size and spacing.