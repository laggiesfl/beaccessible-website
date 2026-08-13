# BeAccessible Phase 3 — Product–Price–Delivery Matrix

**Status:** Governing specification for Payfast payment-gate implementation  
**Branch:** `phase-3-payfast-gate`  
**Date:** 13 August 2026

## Purpose

This matrix determines which BeAccessible offers may proceed to direct online payment and which must remain enquiry-, assessment-, invitation-, quotation-, pilot- or demonstration-based. No Payfast button may be added unless the product has an approved price, defined deliverable, delivery method, delivery timing, refund/cancellation treatment and post-payment fulfilment route.

## Decision rules

1. **Invitation-only products** do not use direct public checkout.
2. **Free products** do not use Payfast.
3. **Demonstrations and pilots** do not use Payfast unless separately converted into a defined commercial offer.
4. **Professional services, bespoke audits and advisory work** remain enquiry/quotation-based unless converted into a fixed-scope package with a fixed price.
5. **Licence products and fixed digital services** are suitable for Payfast only after price, licence term, authorised-user scope and delivery/access activation are fixed.
6. A customer must see the price, deliverable, delivery method/timing, refund/cancellation terms and required policy acknowledgement **before** being sent to Payfast.
7. Successful payment must trigger a defined fulfilment action; a generic thank-you page is not sufficient.

## Product matrix

| Product / offer | Current status | Public action | Direct Payfast now? | Price status | Delivery / fulfilment model | Refund / cancellation treatment | Phase 3 decision |
|---|---|---|---|---|---|---|---|
| **BiasLens™ Full Platform** | Available now · Invitation only | **Request Consideration** | **No** | Organisation-specific | Approved access / account activation / assessment engagement after BeAccessible review | Controlled by engagement/licence terms; no public instant purchase | Keep outside public checkout |
| **BeAccessible AI Cost Audit** | Available now | **Enquire** | Not yet | **Price required** | Digital assessment/report or fixed service package must be defined | Depends on whether automated digital delivery or professional work has started | Candidate after scope + price approval |
| **BeAccessible UD ROI System** | Available now | **Discuss the Assessment** | Not yet | Quote / package not fixed | Assessment/advisory deliverable | Professional-service cancellation terms | Keep enquiry/quote unless converted to fixed package |
| **Focus Action Agent** | Available now | **Discuss Licensing** | Not yet | **Licence price/access model required** | Account/licence activation | Licence-period and cancellation terms required | Candidate after licence specification |
| **UDL Educator Hub — Free Core** | Available now | **Open the Hub** | **No** | Free | Immediate online access | Not applicable to free core | Keep free |
| **UDL Educator Hub — paid licence(s)** | Available now | **Licence / upgrade** | **Yes, once approved** | **Exact price(s) and term(s) required** | Licence/account activation or access instructions after payment | Digital/licence refund rules; activation status must be recorded | **Primary Payfast candidate** |
| **Remote Building Audit** | Available now | **Request Audit** | Not yet | Quote or fixed package not confirmed | Remote audit + report + remediation priorities | Professional-service rules; work-start timing matters | Keep request/quote unless fixed package approved |
| **HR Policy Compliance Auditor — free audit** | Available now | **Start Audit** | **No** | Free | Immediate digital audit access | Not applicable to free tier | Keep free |
| **HR Policy Compliance Auditor — premium rewrite / remediation** | Available now | **Request / upgrade** | **Yes, if fixed scope approved** | **Exact fixed price required** | Customer supplies policy; BeAccessible delivers defined rewrite/remediation output electronically | Custom/professional-service rules; work-start point must be disclosed | **Secondary Payfast candidate** |
| **Governance Assessment** | Available now | **Start Assessment** | Not yet | Price/status not confirmed | Assessment output / advisory pathway | Depends on free vs paid assessment model | Do not add payment until commercial model confirmed |
| **BeAccessible PA Platform** | Available now | **Request Service** | No for now | Service pricing/matching fees not fixed | Matching/service coordination | Service-specific cancellation terms required | Keep service request / quote |
| **BeAccessible Learning Hub** | Available now | **Visit Learning Hub / Enrol** | Separate decision | Course/platform pricing may live in learning platform | Course enrolment/account access | Course/platform terms | Do not duplicate checkout until learning-platform payment model is confirmed |
| **Digital / Green Payments Pilot** | Pilot / early access | **Discuss Pilot** | **No** | Not a retail offer | Pilot engagement | Pilot agreement | No public payment |
| **AI Governance Suite** | Pilot / early access | **Request Pilot Access** | **No** | Not a standard retail offer | Pilot/account access | Pilot agreement | No public payment |
| **PM + BA Agent System** | Pilot / early access | **Discuss the Solution** | **No** | Not a standard retail offer | Pilot/implementation engagement | Proposal/SOW | No public payment |
| **ADF SPADRA Interactive Demo** | Demonstration | **Discuss Similar Work** | **No** | Not for retail sale | Bespoke project discussion | Proposal/SOW | No public payment |
| **GrantFlow AI™** | Demonstration | **Explore Demonstration** | **No** | Not market-ready for standard purchase | Demonstration only | Not applicable | No public payment |
| **TrustOps** | Demonstration | **View Product Catalogue** | **No** | Not market-ready for standard purchase | Demonstration only | Not applicable | No public payment |
| **InclusiveLearn™** | Earlier demonstration | **Enquire** | **No** | Superseded in public positioning by UDL Educator Hub | Demonstration/reference | Not applicable | No public payment |
| **CyberResilience OS™** | Demonstration | **Explore Demonstration** | **No** | Not market-ready for standard purchase | Demonstration only | Not applicable | No public payment |
| **Accommodation Cost Calculator** | Demonstration/tool | **Enquire / use if separately public** | **No** | No paid package approved | Tool access | Not applicable unless packaged commercially | No public payment |
| **Donor Concept Note Assistant** | Demonstration/tool | **Enquire** | **No** | No paid package approved | Tool/access or service | Depends on future packaging | No public payment |

## Recommended Phase 3 launch sequence

### Pilot transaction 1 — UDL Educator Hub paid licence

Use this first **only after** BeAccessible approves:
- exact licence tier name;
- price in ZAR;
- whether price is once-off or recurring;
- licence duration;
- number/type of authorised users;
- exact post-payment access method;
- activation timing;
- refund/cancellation treatment.

**Proposed customer journey:**

`UDL Educator Hub → Choose licence → BeAccessible payment gate → Review price + licence + delivery + policies → Required acceptance → Payfast → Payment confirmation → Licence/access activation → Accessible confirmation email`

### Pilot transaction 2 — HR Policy Compliance Auditor premium rewrite

Use second **only if** the premium service can be converted into a clear fixed-scope package with:
- exact price;
- document/page/word limits or another objective scope boundary;
- customer input requirements;
- turnaround time;
- exact deliverable format;
- point at which work is considered started;
- cancellation/refund rules once work starts.

## Payment-gate requirements

Every Payfast-eligible product must enter through a BeAccessible-controlled review page before payment. The gate must show:

- Product/service name
- Plain-language description of what is being purchased
- Price in **ZAR** and whether VAT/tax is included, excluded or not applicable
- Once-off vs recurring billing
- Licence term or service scope
- What the customer must provide, if anything
- Delivery/activation method
- Expected delivery/activation timing
- Refund and cancellation summary
- Links to Terms & Conditions, Refund/Cancellation/Delivery Policy, Privacy Policy and Accessibility Statement
- Required unticked acknowledgement checkbox for the applicable purchase/refund terms
- Accessible error messaging and recovery
- A single clear **Continue to secure payment** action

## Post-payment fulfilment requirements

A successful Payfast transaction must not rely only on the customer returning to a success URL. Fulfilment design must include verified payment status and a recorded order reference before access/delivery is granted.

Minimum fulfilment record:
- Order reference
- Product/tier
- Customer name and email
- Amount and currency
- Payfast transaction/payment reference
- Payment status
- Policy/version accepted
- Timestamp
- Delivery/activation status
- Refund/cancellation status where applicable

## Accessibility and Universal Design requirements

Target **WCAG 2.2 AA as the minimum**, applying AAA criteria where reasonably achievable. The payment journey must include:

- semantic headings and landmarks;
- full keyboard operation;
- visible focus indicators;
- sufficient target size and spacing;
- no colour-only status communication;
- clearly associated labels and instructions;
- accessible validation and error summaries;
- tolerance for slower or imprecise motor interaction;
- no unnecessary time limits;
- plain language and concise steps;
- meaningful link and button text;
- responsive reflow and zoom support;
- reduced-motion support where applicable;
- confirmation that works with screen readers and other assistive technology.

## Outstanding approvals before Payfast activation

The website architecture can be built before these values are known, but **live payment must remain disabled** until BeAccessible approves:

1. UDL Educator Hub paid licence tier(s) and exact ZAR price(s).
2. UDL licence duration and fulfilment/activation mechanism.
3. HR premium rewrite fixed price and objective scope, if it will be sold through Payfast.
4. Whether any other currently enquiry-based product will be converted into a fixed-price package.
5. Tax/VAT wording to display at checkout.
6. The business/legal particulars that must appear in checkout and transaction communications.

---

**Accessibility Compliance Note:** This specification applies WCAG 2.2 AA as a minimum and Universal Design principles of equitable use, flexibility, perceptible information, tolerance for error and low physical effort. It deliberately prevents payment buttons on ambiguous, invitation-only, pilot or demonstration offers and requires text-based status communication, accessible policy acknowledgement and a recoverable checkout flow.