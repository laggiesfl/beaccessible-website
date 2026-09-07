# Knowledge & Impact Intelligence Implementation Plan

> **For agentic workers:** Implement task-by-task with TDD and small commits.

**Goal:** Build an accessible, synthetic-data demonstration that shows how programme and grantee reports become structured, traceable organisational intelligence.

**Architecture:** Add a reusable Knowledge & Impact Intelligence demo surface to the existing TrustOS Next.js app without changing current TrustOps/GrantFlow modules, authentication, Supabase schema, or deployment architecture. The first slice is read-only and uses synthetic data so it can demonstrate report synthesis, cross-project patterns, knowledge retrieval, impact evidence and source provenance safely.

**Tech Stack:** Next.js App Router, React, TypeScript, existing TrustOS CSS/brand system, Vitest.

**Spec:** Approved Zenex Knowledge & Impact Intelligence — Demonstration Specification, 7 September 2026.

## Global Constraints
- Complement existing systems; do not position as replacement software.
- Synthetic data only in this build slice.
- Distinguish Source evidence, Calculated indicator and AI interpretation.
- Every substantive insight must expose source provenance.
- Keyboard and screen-reader operation, visible focus, responsive layout, reduced-motion support, no colour-only status communication.
- No ROI claim where evidence is insufficient.
- Preserve existing TrustOS/GrantFlow code paths and infrastructure.

---

### Task 1: Demo domain model and dataset
**Files:**
- Create: `trustos-app/lib/knowledge-impact/demo-data.ts`
- Test: `trustos-app/tests/knowledge-impact/demo-data.test.ts`

- [ ] Define typed programmes, projects, reports, evidence objects and insights.
- [ ] Add synthetic evidence covering repeated themes, contradictory evidence, an incomplete indicator and an insufficient-ROI case.
- [ ] Test provenance completeness and evidence classifications.

### Task 2: Accessible demonstration experience
**Files:**
- Create: `trustos-app/components/knowledge-impact-demo.tsx`
- Create: `trustos-app/app/knowledge-impact-demo/page.tsx`
- Modify: `trustos-app/app/globals.css`

- [ ] Implement a clear demo landing view with purpose and synthetic-data notice.
- [ ] Implement report library, report intelligence, portfolio intelligence, knowledge explorer and provenance views.
- [ ] Provide keyboard-operable navigation and native semantic controls.
- [ ] Label source facts, calculations and AI interpretations in text, not colour alone.
- [ ] Provide direct evidence drill-down for each displayed insight.

### Task 3: Discovery entry point and verification
**Files:**
- Modify: `trustos-app/app/(protected)/app/page.tsx`
- Create: `trustos-app/tests/knowledge-impact/page.contract.test.tsx`

- [ ] Add a non-disruptive workspace link describing the capability as a demonstration.
- [ ] Test required headings, synthetic-data disclosure, provenance controls and accessibility labels.
- [ ] Run unit tests, typecheck and production build.
- [ ] Commit the verified slice and inspect deployment status before presenting a shareable link.