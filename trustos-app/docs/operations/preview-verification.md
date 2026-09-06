# TrustOS Phase 2 preview verification

**Status:** PREVIEW VERIFICATION IN PROGRESS — NOT APPROVED FOR PRODUCTION  
**Record date:** 2026-09-06
**Branch:** `phase2/identity-access-design`  
**Verified application commit:** `cf7af6ad75979766f4ec733cd9567971e5dd5f45`
**Staging project:** `trustos-phase-2-preview`  
**Stable staging origin:** `https://trustos-phase-2-preview.vercel.app`

## Verified gates

- Vercel staging deployment for the verified application commit: READY.
- Current application unit/component suite: **108/108 passed** across 22 files.
- TypeScript verification: passed.
- Production build: passed.
- Full staged Playwright matrix: **48/48 passed** with no skips: 24 Chromium and 24 Firefox.
- Deployed axe coverage passed for sign-in, invitation activation, client workspace, team administration, audit and platform administration.
- Staged 320 CSS pixel reflow, reduced-motion, forced-colour and sign-in focus/error-summary checks passed in Chromium and Firefox.
- Fictional two-organisation release-denial and tenant-isolation matrix passed in Chromium and Firefox.
- Module-role checks passed for fictional viewer, contributor, reviewer, approver and module administrator accounts; roleless GrantFlow access remained denied.
- Licensed client administrator module switching passed; unlicensed GrantFlow, suspended-organisation and removed-membership denials passed.
- Disposable Supabase reset from tracked migrations: passed.
- Full Supabase pgTAP database matrix: passed.
- Warning-level local database lint with `--fail-on warning`: passed.
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

The following release gates are **not yet recorded as passed**:

- Manual keyboard-only completion across the full set of critical account journeys beyond the automated focus/keyboard checks already recorded.
- NVDA verification with Firefox and a Chromium browser on the critical account journeys.
- Browser-console and sensitive-network-payload review against the final staged deployment.
- Supabase Auth leaked-password protection enablement and re-check.

The protected E2E fixture credential remains local to the authorised Windows runner and has deliberately not been copied into GitHub.

## Current known limitation

Supabase Auth currently reports that leaked-password protection is disabled. This is an Auth project configuration warning rather than a Phase 2 database migration warning and must be reviewed before broader production release.

## Release boundary

This branch and preview are for controlled verification only. PR #4 remains draft. Do not merge to `main`, change the production alias, issue real client invitations or run a production Vercel promotion without separate explicit approval.
