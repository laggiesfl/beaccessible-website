# BeAccessible Homepage Phase 2 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved commercial-readiness messaging and legal navigation into the existing BeAccessible homepage without changing the live `main` branch or activating payments.

**Architecture:** Preserve the existing large `index.html` source exactly because it contains the original BeAccessible logo embedded directly in the file. Netlify runs `scripts/apply_phase2_homepage.py` during the build, transforming only the approved product copy, product status/CTA markup, catalogue CTA, and footer legal links in the deploy output. The script fails the build if any expected source block does not match exactly, preventing partial transformations. The Phase 2 branch remains the review boundary; production `main` is untouched until explicit approval.

**Tech Stack:** Static HTML/CSS/JavaScript, Python 3 standard library build transform, GitHub branch/PR workflow, Netlify continuous deployment.

## Global Constraints

- Work only on `phase-2-commercial-catalogue`; do not modify `main`.
- Preserve existing logo, colours, typography, hero, services, contact section, navigation behaviour, responsive behaviour, and accessibility features.
- Use visible text for product status; never rely on colour alone.
- Do not add Payfast, checkout, product prices, or payment CTAs.
- Target WCAG 2.2 Level AA minimum; apply AAA criteria where feasible.
- Keep PR #1 as a draft and unmerged during implementation.

---

### Task 1: Transform homepage commercial product section at build time

**Files:**
- Create: `scripts/apply_phase2_homepage.py`
- Modify: `netlify.toml`
- Source preserved: `index.html`

**Interfaces:**
- Consumes: existing `index.html` `#products` section and Phase 2 catalogue `products.html`.
- Produces: deployed homepage product cards with `Available Now` or `Demonstration` visible status text and context-appropriate links.

- [x] **Step 1: Verify current homepage legacy product wording and card structure**
- [x] **Step 2: Add strict, one-match-only product introduction transformation**
- [x] **Step 3: Add product-specific visible status and CTA transformations**
- [x] **Step 4: Replace the catalogue CTA with `Explore Products & Platforms`**
- [x] **Step 5: Reject Payfast, Buy Now, and checkout language in transformed homepage**
- [x] **Step 6: Configure Netlify to run the transform before publishing**

### Task 2: Add footer legal and accessibility navigation at build time

**Files:**
- Create/modify: `scripts/apply_phase2_homepage.py`
- Source preserved: `index.html`

**Interfaces:**
- Consumes: `terms.html`, `refund-cancellation-delivery.html`, `privacy.html`, `accessibility.html`.
- Produces: persistent legal/accessibility links in the deployed existing footer.

- [x] **Step 1: Preserve existing footer layout/content**
- [x] **Step 2: Insert meaningful legal and accessibility links in the existing Company list**
- [x] **Step 3: Require all four linked filenames in transformed output**

### Task 3: Safety and branch verification

**Files:**
- Verify: `index.html`
- Verify: `scripts/apply_phase2_homepage.py`
- Verify: `netlify.toml`
- Verify: PR #1

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: review-ready Phase 2 branch, not production deployment.

- [x] **Step 1: Preserve existing homepage source, including semantic/accessibility implementation**
- [x] **Step 2: Make transformation fail closed if source does not match exactly**
- [x] **Step 3: Confirm catalogue and legal destinations are present on branch**
- [x] **Step 4: Compare branch with main; branch is ahead and not behind**
- [x] **Step 5: Verify PR #1 remains draft and unmerged**

## Remaining Review Gate

Netlify has not surfaced a deploy-preview status through the connected GitHub status API yet. Do not merge PR #1 until the branch deploy/preview has been visually reviewed in Netlify and the four legal/business particulars required before Phase 3 have been completed.
