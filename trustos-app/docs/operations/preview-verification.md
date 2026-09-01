# TrustOS Phase 2 preview verification

**Status:** PREVIEW VERIFICATION IN PROGRESS — NOT APPROVED FOR PRODUCTION  
**Record date:** 2026-09-02  
**Branch:** `phase2/identity-access-design`  
**Recorded commit:** `06e39247018eb2fe5368841d99772287f6657d0c`  
**Staging project:** `trustos-phase-2-preview`  
**Stable staging origin:** `https://trustos-phase-2-preview.vercel.app`

## Verified gates

- Vercel deployment status for the recorded commit: success.
- TrustOS application unit, TypeScript, production-build and Chromium legacy/browser regression gates passed on the Phase 2 branch before the database-only follow-up commits.
- Disposable Supabase reset from tracked migrations: passed.
- Full Supabase pgTAP database matrix: passed.
- Warning-level local database lint with `--fail-on warning`: passed.
- Hosted Supabase security advisor: no unresolved Phase 2 database warning after the session-touch boundary correction.
- The public session-touch RPC is `SECURITY INVOKER`; the privileged JWT-derived implementation is confined to the `private` schema.

## Commands represented by this record

```bash
npm --prefix trustos-app test
npm --prefix trustos-app run typecheck
npm --prefix trustos-app run build
TRUSTOS_REQUIRE_BROWSER=1 CODEX_PRIMARY_RUNTIME_NODE_MODULES=trustos-app/node_modules node --test scripts/*.test.cjs
supabase db reset
supabase test db
supabase db lint --local --level warning --fail-on warning
```

## Remaining release evidence

The following are release gates and are **not yet recorded as passed**:

- Full staged Playwright suite in both Chromium and Firefox with no skips.
- Deployed two-organisation denial matrix using the fictional E2E fixtures.
- Deployed axe checks across sign-in, invitation, workspace, platform administration, team administration and audit views.
- Keyboard-only completion and focus checks across all critical account journeys.
- 320 CSS pixel and 400% equivalent reflow checks on the staged build.
- Reduced-motion and forced-colour browser verification.
- NVDA verification with Firefox and Chromium on the critical account journeys.
- Browser-console and sensitive-network-payload review against the final staged deployment.

The Windows E2E runner holding the local protected fixture credential was offline when this record was updated. The credential has deliberately not been copied into GitHub.

## Current known limitation

Supabase Auth currently reports that leaked-password protection is disabled. This is an Auth project configuration warning rather than a Phase 2 database migration warning and must be reviewed before broader production release.

## Release boundary

This branch and preview are for controlled verification only. PR #4 remains draft. Do not merge to `main`, change the production alias, issue real client invitations or run a production Vercel promotion without separate explicit approval.
