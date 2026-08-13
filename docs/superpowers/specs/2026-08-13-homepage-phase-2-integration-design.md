# BeAccessible Homepage Phase 2 Integration Design

## Purpose

Integrate the already-approved Phase 2 commercial catalogue and legal structure into the existing BeAccessible homepage without replacing the current brand identity, hero, services, contact content, or overall visual language.

## Scope

The homepage integration will modify only `index.html` on the `phase-2-commercial-catalogue` branch.

The implementation will:

- preserve the existing BeAccessible logo, colours, typography, hero, services, capability-transfer messaging, contact section, navigation behaviour, responsive behaviour, and accessibility features;
- replace the current Digital Products positioning that says all products are demo-ready with commercial-readiness language;
- update product status labels so status is conveyed with text, not colour alone;
- change product calls to action from generic `Live Demo` wording to context-appropriate actions such as `Explore`, `Request Assessment`, `Request Audit`, `Discuss Licensing`, or `View Product Catalogue`;
- point the homepage products CTA to `products.html`;
- add footer links to `terms.html`, `refund-cancellation-delivery.html`, `privacy.html`, and `accessibility.html`;
- keep Payfast absent from the homepage in Phase 2;
- keep the live production branch `main` untouched until the draft PR has been reviewed and approved.

## Commercial Messaging

The homepage product section will be repositioned from a demo showcase to a commercial portfolio. The section will communicate that BeAccessible offers accessible digital tools, assessments, platforms, and selected pilot solutions designed to build lasting organisational capability.

The homepage will not imply that every deployed product is equally purchasable. Product-specific status and CTA text will direct visitors to the correct commercial pathway.

## Product Status Model

The homepage will use the same status language as `products.html`:

- `Available Now`
- `Pilot / Early Access`
- `Demonstration`

Status will always be visible as text and will not rely on colour alone.

## Navigation and Footer

Existing primary navigation will be preserved. Where the current homepage includes a products link or products CTA, it will route to `products.html`.

The footer will retain existing content and add direct links to the four Phase 2 policy/accessibility pages.

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

1. `index.html` still contains exactly one primary `h1`.
2. The skip link and `main` target remain present.
3. Existing navigation and contact anchors remain functional.
4. The products CTA resolves to `products.html`.
5. Footer legal links resolve to the four Phase 2 pages.
6. Product statuses are expressed in visible text.
7. No Payfast or payment CTA is introduced.
8. The Phase 2 branch remains ahead of `main` without modifying `main`.
9. The draft PR remains unmerged.
