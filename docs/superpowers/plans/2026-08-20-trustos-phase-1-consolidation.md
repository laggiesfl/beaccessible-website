# TrustOS Phase 1 Consolidation Plan

## Completed in this checkpoint

1. Inventory the existing TrustOps and GrantFlow behaviours and public claims.
2. Establish a dedicated local feature branch and baseline the original module files.
3. Add regression tests for preserved entry points, workflows, keyboard behaviour, and honest demo language.
4. Build the TrustOS shell with independently configurable module visibility.
5. Isolate the legacy modules in a constrained frame and retain full-page access.
6. Add TrustOS-specific privacy and accessibility statements.
7. Verify JavaScript syntax, static references, module switching, demonstration configuration states, and legacy invariants.
8. Preserve each module's in-memory session by keeping one isolated frame per configured module.
9. Fail closed before configuration is validated, including no-script, zero-module, and malformed-catalogue states.
10. Remove the dormant live form endpoint, fix unsupported automation/authentication claims, and keep the pilot interaction sample-only.
11. Add automated contrast checks, a clearer privacy notice, and version-controlled Vercel security headers.

## Dedicated Vercel deployment rule

Build the dedicated TrustOS Vercel package with `node scripts/build-trustos-vercel-package.cjs .trustos-vercel-dist`. The builder copies `trustos-vercel.json` to the package as `vercel.json`; the repository file deliberately uses the TrustOS-specific name so these restrictive demonstration headers do not alter the existing BeAccessible website's separate deployment configuration.

The package root should continue to use the contents of `trustos.html` as its virtual `index.html`. The dedicated package contains only the TrustOS shell, its two module demonstrations, the TrustOS statements and scripts, and the mapped Vercel manifest.

## Deferred to later phases

- Server-enforced subscriptions and entitlements.
- Shared authentication and role-based access control.
- Shared production database, audit records, and retention controls.
- Cross-module workflow and reporting.
- Data migration and production security review.
- Manual assistive-technology testing and disabled-user evaluation.

## Release guard

This checkpoint must not be presented as production-ready. Publishing, enabling real submissions, or connecting live personal data requires explicit release approval and the later-phase safeguards above.
