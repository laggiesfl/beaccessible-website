# Task 1 report: isolated TrustOS application shell

## Implementation

Created the dedicated `trustos-app/` Next.js package without changing the root-level BeAccessible static website.

- Pinned the required runtime and development dependencies exactly and committed `package-lock.json`.
- Added Next.js, TypeScript, Vitest, alias, and test setup configuration.
- Added `.gitignore` entries for Next output, dependencies, test artifacts, TypeScript build metadata, and environment files while preserving `.env.example`.
- Added `RootLayout` with `lang="en"`, the first-focusable skip link, TrustOS header, content slot, and accessibility/privacy footer links.
- Added the home page main landmark with `id="main-content"` and the accessible TrustOS content label.
- Added shared CSS tokens preserving the approved BeAccessible values exactly: Deep Blue `#1F3F6B`, Mid Blue `#2F5C9A`, Soft Blue `#4A78B5`, and the existing supporting palette. The stylesheet also provides a two-colour focus ring, responsive content widths, 44px interactive control minimums, and reduced-motion handling.
- Added a branded-shell behavior test. It uses server rendering and an isolated DOM container, avoiding nested `<html>` jsdom warnings while retaining assertions for the skip link, TrustOS brand, and named main region.

## Files

- `trustos-app/package.json`
- `trustos-app/package-lock.json`
- `trustos-app/.gitignore`
- `trustos-app/tsconfig.json`
- `trustos-app/next-env.d.ts`
- `trustos-app/next.config.ts`
- `trustos-app/vitest.config.ts`
- `trustos-app/tests/setup.ts`
- `trustos-app/tests/app/brand-shell.test.tsx`
- `trustos-app/app/layout.tsx`
- `trustos-app/app/page.tsx`
- `trustos-app/app/globals.css`

## TDD evidence

Production change guarded by the test: removing the semantic skip link, TrustOS brand, or named main region would fail the branded-shell test.

### RED

After configuring the test harness, before creating `app/layout.tsx`, ran:

```text
$ npm --cache /tmp/trustos-npm-cache test -- tests/app/brand-shell.test.tsx

> trustos-app@1.0.0 test
> vitest run tests/app/brand-shell.test.tsx

FAIL  tests/app/brand-shell.test.tsx
Error: Failed to resolve import "@/app/layout" from "tests/app/brand-shell.test.tsx". Does the file exist?
Test Files  1 failed
Tests       no tests
```

This is the intended missing-layout failure. An initial harness-only run exposed `jsx: preserve` as incompatible with Vitest's TSX transform; changing the test compiler setting to `react-jsx` allowed the test to reach the intended missing-module RED state. No application shell code existed during that RED run.

### GREEN

After implementing the shell, home landmark, and global styles, ran:

```text
$ npm --cache /tmp/trustos-npm-cache test -- tests/app/brand-shell.test.tsx

> trustos-app@1.0.0 test
> vitest run tests/app/brand-shell.test.tsx

Test Files  1 passed (1)
Tests       1 passed (1)
```

## Full checks

Fresh command:

```text
$ npm --cache /tmp/trustos-npm-cache test && npm --cache /tmp/trustos-npm-cache run typecheck && npm --cache /tmp/trustos-npm-cache run build
```

Results:

```text
vitest run:                 1 test passed in 1 file
tsc --noEmit:               exit 0
next build:                 exit 0
Compiled successfully
Route (app): / and /_not-found generated as static pages
```

The cache flag is an environment accommodation: the workspace has no writable default `/root/.npm` cache. It does not change the package scripts or verification behavior. npm also emits the host-provided `Unknown env config "http-proxy"` warning; no test, typecheck, or application build warnings remain.

## Self-review

- Scope: all runtime additions are under `trustos-app/`; root static-site files were not modified.
- Accessibility: verified the language declaration, skip target, named main page landmark, visible two-colour focus treatment, 44px control baseline, responsive shell width, and reduced-motion override.
- Branding: verified the approved BeAccessible palette values are copied verbatim rather than substituted.
- Test quality: server-rendered shell behavior is asserted through user-visible semantics; it does not snapshot implementation details or mock components. Removing the brand, skip link/target, or accessible main label is caught by the test.
- Configuration: direct dependency ranges are exact versions and the committed npm lockfile resolves the installed graph.

## Concerns

`npm ls --depth=0` reported `@emnapi/runtime@1.11.3` and `@img/sharp-wasm32@0.35.3` as extraneous local optional packages after the installation attempts. The required unit, type, and production-build checks pass. An `npm prune --ignore-scripts` cleanup attempt was blocked by the environment's usage-limit guard, so no cleanup workaround was attempted. These ignored `node_modules/` entries are not part of the committed artifact.
