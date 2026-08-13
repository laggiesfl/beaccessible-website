# BeAccessible Homepage Phase 2 Integration Design

## Purpose

Integrate the already-approved Phase 2 commercial catalogue and legal structure into the existing BeAccessible homepage without replacing the current brand identity, hero, services, contact content, or overall visual language.

## Scope

The homepage integration preserves the original `index.html` source and applies the approved changes to the deployed homepage during the Netlify build. This is necessary because the existing source embeds the original BeAccessible logo directly in the HTML; preserving the source avoids unnecessary rewriting of the brand asset and existing page structure.

The deployment transformation will:

- preserve the existing BeAccessible logo, colours, typography, hero, services, capability-transfer messaging, contact section, navigation behaviour, responsive behaviour, and accessibility features;
- replace the current Digital Products positioning that says all products are demo-ready with commercial-readiness language;
- update product status labels so status is conveyed with text, not colour alone;
- change product calls to action from generic `Live Demo` wording to context-appropriate actions such as `Explore`, `Start Audit`, or `View Product Catalogue`;
- point the homepage products CTA to `products.html`;
- add footer links to `terms.html`, `refund-cancellation-delivery.html`, `privacy.html`, and `accessibility.html`;
- keep Payfast absent from the homepage in Phase 2;
- keep the live production branch `main` untouched until the draft PR has been reviewed and approved.

## Implementation Safety

Netlify runs `scripts/apply_phase2_homepage.py` before publishing the branch output. Every transformation expects exactly one known source match. If the current homepage no longer matches an approved source block, the build fails instead of applying a partial or ambiguous change.

This preserves the original GitHub homepage source as the recovery baseline while still producing the approved Phase 2 homepage in the deploy output.

## Commercial Messaging

The homepage product section will be repositioned from a demo showcase to a commercial portfolio. The section will communicate that BeAccessible offers accessible digital tools, assessments, platforms, and selected specialist solutions designed to build lasting organisational capability.

The homepage will not imply that every deployed product is equally purchasable. Product-specific status and CTA text will direct visitors to the correct commercial pathway.

## Product Status Model

The homepage uses visible text status labels, including:

- `Available Now`
- `Pilot / Early Access` where relevant
- `Demonstration`

Status will always be visible as text and will not rely on colour alone.

## Navigation and Footer

Existing primary navigation is preserved. The products catalogue CTA routes to `products.html`.

The footer retains existing content and adds direct links to the four Phase 2 policy/accessibility pages.

## Accessibility Requirements

The homepage must retain or improve the existing accessibility implementation:

- semantic heading hierarchy;
- skip link to main content;
- keyboard-operable navigation and controls;
- visible `:focus-visible` states;
- meaningful link text;
- responsive layout;
- `prefers-reduced-motion` support;
- high-contrast text and controls using the existing BeAccessible palette;
- no colour-only product status communication;
- no unnecessary motion or auto-advancing content.

Target: WCAG 2.2 Level AA as the minimum, with AAA criteria applied where feasible.

## Non-Goals

This Phase 2 homepage integration will not:

- activate Payfast;
- add checkout forms or payment buttons;
- set final product prices;
- create new product functionality;
- change the existing services architecture;
- remove legacy product/demo files from the repository;
- merge the draft PR to `main` without explicit review and approval.

## Verification

Before the homepage change is considered ready for review, verify:

1. The original `index.html` source remains unchanged on the Phase 2 branch.
2. The build transformation targets only approved product copy/status/CTA and footer legal-link blocks.
3. The products CTA resolves to `products.html`.
4. Footer legal links resolve to the four Phase 2 pages.
5. Product statuses are expressed in visible text.
6. No Payfast or payment CTA is introduced.
7. The build fails if any expected source block is missing or ambiguous.
8. The Phase 2 branch remains ahead of `main` without modifying `main`.
9. The draft PR remains unmerged.
