# BeAccessible Homepage Phase 2 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved commercial-readiness messaging and legal navigation into the existing BeAccessible homepage without changing the live `main` branch or activating payments.

**Architecture:** Keep the existing single-file static homepage architecture. Modify only the product-section copy/status/CTA markup and footer legal links in `index.html`, preserving the existing hero, services, contact form, branding, responsive behaviour, and accessibility features. The existing `products.html` and policy pages on the Phase 2 branch are the destinations.

**Tech Stack:** Static HTML/CSS/JavaScript, GitHub branch/PR workflow, Netlify continuous deployment.

## Global Constraints

- Work only on `phase-2-commercial-catalogue`; do not modify `main`.
- Preserve existing logo, colours, typography, hero, services, contact section, navigation behaviour, responsive behaviour, and accessibility features.
- Use visible text for product status; never rely on colour alone.
- Do not add Payfast, checkout, product prices, or payment CTAs.
- Target WCAG 2.2 Level AA minimum; apply AAA criteria where feasible.
- Keep PR #1 as a draft and unmerged during implementation.

---

### Task 1: Update homepage commercial product section

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `#products` section and `products.html` catalogue.
- Produces: homepage product cards with `Available Now`, `Pilot / Early Access`, or `Demonstration` visible status text and context-appropriate links.

- [ ] **Step 1: Verify the current homepage contains the legacy phrase**

Check for the exact text `All products are demo-ready — explore them live.` and the button text `View All 12 Products & Live Demos`.

- [ ] **Step 2: Replace the section introduction**

Use: `Accessible digital tools, assessments and platforms that help organisations build inclusion capability internally. Explore products available now, selected pilots and specialist solutions.`

- [ ] **Step 3: Replace generic demo statuses and add meaningful CTAs**

Use visible product-status text and links to either the relevant existing product page, `products.html`, or `#contact`. Keep status and action separate so screen-reader users receive both pieces of information.

- [ ] **Step 4: Update catalogue CTA**

Change the button to `Explore Products & Platforms`, link it to `products.html`, and give it an accessible label that does not claim all products are demos or immediately purchasable.

- [ ] **Step 5: Verify no payment language was introduced**

Search `index.html` for `Payfast`, `Buy Now`, `checkout`, and `payment`; expected result: no Phase 2 payment CTA.

### Task 2: Add footer legal and accessibility navigation

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `terms.html`, `refund-cancellation-delivery.html`, `privacy.html`, `accessibility.html`.
- Produces: persistent legal/accessibility links in the existing footer.

- [ ] **Step 1: Preserve existing footer content**

Do not remove current BeAccessible contact, service, copyright, or navigation content.

- [ ] **Step 2: Add meaningful links**

Add `Terms & Conditions`, `Refund, Cancellation & Delivery`, `Privacy Policy`, and `Accessibility Statement` using their exact filenames.

- [ ] **Step 3: Verify destinations**

Confirm each linked file exists on `phase-2-commercial-catalogue`.

### Task 3: Accessibility and branch verification

**Files:**
- Verify: `index.html`
- Verify: PR #1

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: review-ready Phase 2 homepage change, not production deployment.

- [ ] **Step 1: Check semantic landmarks**

Confirm `<html lang="en">`, one primary `<h1>`, skip link to `#main-content`, and a matching `id="main-content"` remain present.

- [ ] **Step 2: Check product and footer links**

Confirm `products.html`, `terms.html`, `refund-cancellation-delivery.html`, `privacy.html`, and `accessibility.html` are referenced from the homepage.

- [ ] **Step 3: Check reduced-motion and focus support**

Confirm `prefers-reduced-motion` and `:focus-visible` remain in the homepage CSS.

- [ ] **Step 4: Compare branch with main**

Run GitHub branch comparison. Expected: Phase 2 branch ahead of `main`, not behind because of this task, with `main` unchanged.

- [ ] **Step 5: Verify PR remains draft and unmerged**

Fetch PR #1. Expected: `draft=true`, `merged=false`.
