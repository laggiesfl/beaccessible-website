# TrustOS Phase 2 — Vercel Preview Manifest

This file defines the isolated deployment settings for the TrustOS Phase 2 preview. It must not replace the existing `trustos-phase-1` Vercel project.

## Vercel project

- Project name: `trustos-phase-2-preview`
- Git repository: `laggiesfl/beaccessible-website`
- Git branch: `phase2/identity-access-design`
- Root directory: `trustos-app`
- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Node runtime: 22.x preferred to match CI

## Dedicated Supabase boundary

TrustOS Phase 2 must use only:

- Project ref: `napjcycxzyrsruiifuca`
- Project URL: `https://napjcycxzyrsruiifuca.supabase.co`

Do not use the shared BeAccessible/BiasLens project `uuvxqyrqhqktkeovkivx`.

## Required Vercel environment variables

Configure these for the isolated preview project. Never commit secret values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RATE_LIMIT_HMAC_KEY`
- `TRUSTOS_APP_ORIGIN`

`NEXT_PUBLIC_SUPABASE_URL` must point to the dedicated TrustOS Supabase project. `TRUSTOS_APP_ORIGIN` must be the stable HTTPS origin used by the isolated preview project.

## Supabase Auth redirect allowlist

After the Vercel origin is known, allow the following callback in the dedicated TrustOS Supabase project only:

`<TRUSTOS_APP_ORIGIN>/api/auth/callback`

Do not add this callback to BiasLens or the shared BeAccessible Supabase project.

## Release gate

Before any real client organisation or invitation is created:

1. Vercel build is READY.
2. Sign-in, forgot-password, reset-password and PKCE callback work on the deployed origin.
3. Invitation acceptance works end to end.
4. Platform-admin bootstrap/activation works with fictional accounts first.
5. Two fictional organisations prove tenant isolation.
6. TrustOps and GrantFlow licence/role combinations are verified.
7. Keyboard, visible focus, screen-reader semantics, zoom/reflow and reduced-motion checks are completed.
8. No real DGMT data is entered until the final pilot gate is marked safe.
