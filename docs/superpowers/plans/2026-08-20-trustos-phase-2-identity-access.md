# TrustOS Phase 2 Identity and Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, accessible, multi-organisation TrustOS sign-in and role foundation while preserving the working TrustOps and GrantFlow demonstrations.

**Architecture:** A dedicated Next.js application in `trustos-app/` runs on Vercel and uses Supabase Auth plus RLS-protected identity, licence, role, invitation and audit records. Next.js performs every server authorization check, Supabase independently enforces tenant separation, and protected route handlers deliver the existing legacy modules without placing their HTML in a public directory.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, TypeScript, Supabase SSR 0.12.4, Supabase JS 2.112.3, PostgreSQL with RLS and pgTAP, Zod 4.4.3, Vitest 4.1.11, Playwright 1.62.1, axe-core Playwright 4.13.0, Vercel, Resend SMTP.

**Spec:** `docs/superpowers/specs/2026-08-20-trustos-phase-2-identity-access-design.md`

## Global Constraints

- Keep the broader BeAccessible static website unchanged; all new runtime code lives under `trustos-app/`.
- Preserve TrustOps and GrantFlow Phase 1 behaviour, sample data, branding, keyboard navigation and sample-only disclosures.
- WCAG 2.2 Level AA is the release baseline; implement feasible Level AAA measures without claiming unverified conformance.
- Use the BeAccessible palette: Deep Blue `#1F3F6B`, Mid Blue `#2F5C9A`, Soft Blue `#4A78B5`, White `#FFFFFF`, and approved tints.
- Never store roles in `user_metadata`; platform authority uses protected `app_metadata` plus `private.platform_admins`, and organisation/module roles remain database records.
- Never expose the Supabase service-role key, Resend SMTP credential, password, token or client operational record to browser code or logs.
- Enable RLS and explicit grants on every Data API table; anonymous table grants remain revoked.
- Security-definer functions live only in `private`, use `set search_path = ''`, and schema-qualify every object.
- Generate every migration at the time its task begins by running `npx supabase migration new <descriptive_suffix> --workdir ..` from `trustos-app/`, then edit only the returned file. Never invent or reuse a timestamp: CLI generation after the preceding task is what preserves migration order.
- Use test-driven development, exact dependency versions, a committed lockfile and small commits after each passing task.
- A Vercel preview deployment is required before any production promotion; production Phase 1 remains live until explicit release approval.
- Any cross-organisation exposure, privilege escalation, inaccessible critical task, exposed secret or missing required audit event blocks release.

## Planned file structure

```text
trustos-app/
├── app/
│   ├── (auth)/sign-in/page.tsx
│   ├── (auth)/forgot-password/page.tsx
│   ├── (auth)/reset-password/page.tsx
│   ├── (auth)/accept-invitation/page.tsx
│   ├── (protected)/app/page.tsx
│   ├── (protected)/app/admin/platform/page.tsx
│   ├── (protected)/app/admin/team/page.tsx
│   ├── (protected)/app/audit/page.tsx
│   ├── (protected)/app/modules/[moduleId]/route.ts
│   ├── api/auth/callback/route.ts
│   ├── api/cron/audit-retention/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── account-form.tsx
│   ├── error-summary.tsx
│   ├── module-shell.tsx
│   ├── password-field.tsx
│   └── session-timeout-warning.tsx
├── legacy/
│   ├── grantflow.html
│   └── trustops.html
├── lib/
│   ├── actions/{auth,invitations,platform-admin,team-admin}.ts
│   ├── audit/events.ts
│   ├── authz/{permissions,resolver,types}.ts
│   ├── security/{rate-limit,session}.ts
│   ├── supabase/{admin,browser,proxy,server}.ts
│   ├── env.ts
│   └── errors.ts
├── tests/
│   ├── accessibility/
│   ├── auth/
│   ├── authz/
│   ├── database/
│   ├── e2e/
│   └── legacy/
├── proxy.ts
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
└── package.json
supabase/
├── config.toml
├── seed.sql
├── migrations/
└── tests/
```

---

### Task 1: Create the isolated Next.js TrustOS application shell

**Files:**
- Create: `trustos-app/package.json`
- Create: `trustos-app/package-lock.json`
- Create: `trustos-app/.gitignore`
- Create: `trustos-app/tsconfig.json`
- Create: `trustos-app/next.config.ts`
- Create: `trustos-app/vitest.config.ts`
- Create: `trustos-app/tests/setup.ts`
- Create: `trustos-app/tests/app/brand-shell.test.tsx`
- Create: `trustos-app/app/layout.tsx`
- Create: `trustos-app/app/page.tsx`
- Create: `trustos-app/app/globals.css`

**Interfaces:**
- Consumes: the approved BeAccessible palette and current root-level static website boundary.
- Produces: a buildable `trustos-app` package, `RootLayout`, shared brand CSS tokens and test commands used by every later task.

- [ ] **Step 1: Create the package and test configuration**

Run inside `trustos-app/`:

```bash
npm init -y
npm install --save-exact next@16.3.1 react@19.2.8 react-dom@19.2.8 @supabase/ssr@0.12.4 @supabase/supabase-js@2.112.3 zod@4.4.3
npm install --save-dev --save-exact typescript @types/node @types/react @types/react-dom vitest@4.1.11 jsdom @testing-library/react@16.3.2 @testing-library/jest-dom@7.0.1 @playwright/test@1.62.1 @axe-core/playwright@4.13.0 supabase@2.115.0
npm pkg set private=true scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.test="vitest run" scripts.test:watch="vitest" scripts.test:e2e="playwright test" scripts.typecheck="tsc --noEmit"
```

Create `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./tests/setup.ts']`, and test includes under `tests/**/*.test.{ts,tsx}`. Import `@testing-library/jest-dom/vitest` from `tests/setup.ts`.

Create `trustos-app/.gitignore` with `.next/`, `node_modules/`, test artifacts and `.env*`, then add `!.env.example` so example variable names remain version-controlled while values cannot be committed.

- [ ] **Step 2: Write the failing branded-shell test**

```tsx
import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';

test('provides a named main region and TrustOS brand', () => {
  render(<RootLayout><main aria-label="TrustOS content">Test</main></RootLayout>);
  expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main-content');
  expect(screen.getByLabelText('TrustOS content')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the test and verify the missing layout failure**

Run: `npm test -- tests/app/brand-shell.test.tsx`  
Expected: FAIL because `@/app/layout` does not exist.

- [ ] **Step 4: Implement the minimal semantic shell and brand tokens**

`app/layout.tsx` must render `<html lang="en">`, a first-focusable skip link targeting `#main-content`, a TrustOS header, the page content and a footer link to privacy and accessibility information. `app/globals.css` must define the approved palette, a two-colour `:focus-visible` ring, responsive widths, minimum 44-pixel controls and reduced-motion rules.

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header><span className="brand">TrustOS</span></header>
        {children}
        <footer><a href="/accessibility">Accessibility</a> · <a href="/privacy">Privacy</a></footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Run unit, type and production-build checks**

Run: `npm test && npm run typecheck && npm run build`  
Expected: PASS; Next.js reports a successful production build.

- [ ] **Step 6: Commit**

```bash
git add trustos-app
git commit -m "feat: scaffold dedicated TrustOS application"
```

---

### Task 2: Add validated Supabase SSR clients and session proxy

**Files:**
- Create: `trustos-app/.env.example`
- Create: `trustos-app/lib/env.ts`
- Create: `trustos-app/lib/supabase/browser.ts`
- Create: `trustos-app/lib/supabase/server.ts`
- Create: `trustos-app/lib/supabase/admin.ts`
- Create: `trustos-app/lib/supabase/proxy.ts`
- Create: `trustos-app/proxy.ts`
- Create: `trustos-app/tests/auth/env.test.ts`
- Create: `trustos-app/tests/auth/proxy.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` and `RATE_LIMIT_HMAC_KEY`.
- Produces: `getPublicEnv()`, `getServerEnv()`, `createBrowserClient()`, async `createServerClient()`, `createAdminClient()` and `updateSession(request)`.

- [ ] **Step 1: Write failing environment-boundary tests**

```ts
import { getPublicEnv, getServerEnv } from '@/lib/env';

test('rejects missing public Supabase configuration', () => {
  expect(() => getPublicEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_URL');
});

test('never returns the service role from public configuration', () => {
  const env = getPublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'secret'
  });
  expect(env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
});

test('requires the service role only through server configuration', () => {
  expect(() => getServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key'
  })).toThrow('SUPABASE_SERVICE_ROLE_KEY');
});
```

- [ ] **Step 2: Run the tests and verify missing-module failures**

Run: `npm test -- tests/auth/env.test.ts`  
Expected: FAIL because `lib/env.ts` does not exist.

- [ ] **Step 3: Implement Zod environment parsing and client factories**

Use separate schemas so browser code can import only public values:

```ts
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20)
});
const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  CRON_SECRET: z.string().min(32),
  RATE_LIMIT_HMAC_KEY: z.string().min(32)
});
```

The browser factory uses `createBrowserClient` from `@supabase/ssr`. The server factory uses `cookies()` and the official `getAll`/`setAll` adapter. The admin factory imports `server-only`, uses `createClient` from `@supabase/supabase-js`, disables session persistence and is never imported from a Client Component.

- [ ] **Step 4: Implement the Next.js 16 proxy**

`updateSession(request)` must create a per-request Supabase client, call `supabase.auth.getClaims()`, copy refreshed cookies to `NextResponse`, and redirect unauthenticated protected paths with `next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`. It must not authorize roles or licences; those checks remain in protected server layouts and actions.

```ts
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

- [ ] **Step 5: Test cookie propagation and protected-route redirect**

Mock `getClaims()` in `tests/auth/proxy.test.ts` for one authenticated and one unauthenticated request. Assert that `/app` redirects to `/sign-in`, while `/sign-in` remains public and refreshed cookies are copied.

Run: `npm test -- tests/auth && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add trustos-app/.env.example trustos-app/lib trustos-app/proxy.ts trustos-app/tests/auth
git commit -m "feat: add Supabase server session boundary"
```

---

### Task 3: Create the identity, licence, invitation and audit schema

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/seed.sql`
- Create: `supabase/migrations/20260824061656_identity_access_schema.sql` (generated by the Supabase CLI)
- Create: `supabase/tests/identity_access_schema.test.sql`

**Interfaces:**
- Consumes: Supabase `auth.users` UUIDs.
- Produces: enums and tables named in the specification, including `private.platform_admins` and fixed `module_catalog` rows `trustops` and `grantflow`.

- [ ] **Step 1: Start the local Supabase test harness**

Run from the repository root:

```bash
cd trustos-app
npx supabase init --workdir ../supabase
npx supabase start --workdir ../supabase
```

Keep mail testing local. Set password minimum length to 12 and disable open sign-up in `supabase/config.toml`.

- [ ] **Step 2: Write failing pgTAP schema assertions**

```sql
begin;
select plan(12);
select has_schema('private');
select has_table('public', 'organizations');
select has_table('public', 'organization_memberships');
select has_table('public', 'organization_modules');
select has_table('public', 'module_role_assignments');
select has_table('public', 'invitations');
select has_table('public', 'invitation_module_roles');
select has_table('public', 'policy_acceptances');
select has_table('public', 'audit_events');
select has_table('private', 'platform_admins');
select col_is_pk('public', 'organizations', 'id');
select results_eq('select id from public.module_catalog order by id',
  $$values ('grantflow'::text), ('trustops'::text)$$);
select * from finish();
rollback;
```

- [ ] **Step 3: Run the database test and verify schema failures**

Run: `npx supabase test db --workdir supabase`  
Expected: FAIL because the identity tables do not exist.

- [ ] **Step 4: Implement the schema migration**

Create UUID primary keys, timestamps, foreign keys and constrained enums. Add these unique constraints:

```sql
unique (organization_id, user_id) on public.organization_memberships;
unique (organization_id, module_id) on public.organization_modules;
unique (organization_id, user_id, module_id, role)
  on public.module_role_assignments;
unique (invitation_id, module_id, role) on public.invitation_module_roles;
```

Use `citext` for normalized invitation email. Add status checks and ensure `expires_at > created_at`. `audit_events.metadata` defaults to an empty JSON object and receives a check limiting serialized size to 8 KiB.

The migration, not the local seed, must also provision the canonical module catalogue rows with an idempotent `insert ... on conflict do nothing`. This ensures a remote migration deployment always receives `trustops` and `grantflow` even when seed execution is intentionally omitted.

- [ ] **Step 5: Seed two fictional local test organisations**

`seed.sql` is local development/test fixture data and must insert only deterministic fictional values. Fictional organisations and licences remain seed-only and must never move into a deployment migration. The seed may harmlessly repeat the canonical modules so local resets are idempotent; use `on conflict do nothing` for:

```sql
insert into public.module_catalog (id, name, status) values
  ('trustops', 'TrustOps Core', 'active'),
  ('grantflow', 'GrantFlow', 'active');
```

- [ ] **Step 6: Reset and verify**

Run: `npx supabase db reset --workdir supabase && npx supabase test db --workdir supabase`  
Expected: PASS, 12 assertions.

- [ ] **Step 7: Commit**

```bash
git add supabase
git commit -m "feat: add TrustOS identity access schema"
```

---

### Task 4: Enforce organisation separation with grants and RLS

**Files:**
- Create via CLI: `supabase/migrations/<generated>_identity_access_rls.sql`
- Create: `supabase/tests/identity_access_rls.test.sql`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new identity_access_rls --workdir ..
```

The generated timestamp must sort after `20260824061656_identity_access_schema.sql` and every existing migration. Do not copy a placeholder filename from this plan.

**Interfaces:**
- Consumes: Task 3 tables and `auth.uid()`.
- Produces: `private.is_active_session(uuid, uuid)`, `private.is_active_member(uuid, uuid)`, `private.has_org_role(uuid, text)`, `private.has_module_role(uuid, text, text[])`, private `revoke_user_sessions(uuid)` plus its service-role-only public wrapper, explicit grants and default-deny RLS policies.

- [ ] **Step 1: Write the failing two-organisation RLS matrix**

Create two auth users, two organisations and memberships inside the test transaction. Then impersonate the first authenticated user:

```sql
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '10000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true);

select results_eq(
  $$select name from public.organizations order by name$$,
  $$values ('Fictional Client A'::text)$$,
  'a user can see only their active organisation'
);
```

Add assertions proving the user cannot read Client B profiles, memberships, invitations, role assignments or audit events; cannot insert audit events; and cannot update a row into another organisation. A client administrator may read the minimal profiles of active members in their own organisation; an ordinary team member may read only their own profile.

- [ ] **Step 2: Run the RLS test and verify cross-organisation exposure**

Run: `npx supabase test db --workdir supabase --file supabase/tests/identity_access_rls.test.sql`  
Expected: FAIL because RLS policies do not exist.

- [ ] **Step 3: Implement private authorization helpers**

Each helper must use the safe pattern:

```sql
create or replace function private.is_active_member(target_org uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = target_user
      and m.status = 'active'
      and o.status = 'active'
  );
$$;
revoke all on function private.is_active_member(uuid, uuid) from public;
grant execute on function private.is_active_member(uuid, uuid) to authenticated;
```

Implement the organisation-role and additive module-role helpers with the same schema and search-path protections.

`private.is_active_session` must compare `auth.jwt() ->> 'session_id'` with a live `auth.sessions.id` owned by the same user. Every tenant helper calls it so a deleted session is denied by both the application and RLS even before its short-lived access token expires. `private.revoke_user_sessions(target_user)` deletes that user's rows from `auth.sessions` and is covered by pgTAP tests. Where server code must invoke a private transaction over the Data API, expose a `public` security-invoker wrapper granted only to `service_role`; the wrapper calls the narrowly granted `private` security-definer implementation. Never place a security-definer function in an exposed schema.

- [ ] **Step 4: Apply explicit grants and policies**

Revoke all table privileges from `anon`. Grant `authenticated` only required `select` access plus narrowly required updates. Enable RLS on every public table. Policies must use both `using` and `with check` for updates. Client administrators may manage team-member invitations and role assignments only in their own active organisation and only for active licensed modules. No client policy may grant access to `private.platform_admins`.

- [ ] **Step 5: Verify the complete RLS matrix**

Run:

```bash
npx supabase db reset --workdir supabase
npx supabase test db --workdir supabase
```

Expected: PASS for schema and RLS tests, including all cross-organisation denial assertions.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/identity_access_rls.test.sql
git commit -m "feat: enforce TrustOS tenant isolation"
```

---

### Task 5: Implement the authorization decision resolver

**Files:**
- Create: `trustos-app/lib/authz/types.ts`
- Create: `trustos-app/lib/authz/permissions.ts`
- Create: `trustos-app/lib/authz/resolver.ts`
- Create: `trustos-app/tests/authz/resolver.test.ts`

**Interfaces:**
- Consumes: `AccessContext` with session, organisation, membership, licence and additive module roles.
- Produces: `resolveAccess(input: AccessRequest): AccessDecision`, `moduleRoleAllows(role, action): boolean`, and reason codes used by UI and audit events.

- [ ] **Step 1: Define the explicit types in the failing test**

```ts
type ModuleRole = 'module_admin' | 'contributor' | 'reviewer' | 'approver' | 'viewer';
type ModuleAction = 'view' | 'edit' | 'review' | 'settings' | 'final_decision';
type DenialReason = 'no_session' | 'inactive_organization' | 'no_membership' |
  'unlicensed_module' | 'no_module_role' | 'insufficient_role';

test.each([
  ['viewer', 'view', true],
  ['viewer', 'edit', false],
  ['contributor', 'edit', true],
  ['reviewer', 'review', true],
  ['module_admin', 'settings', true],
  ['module_admin', 'final_decision', false],
  ['approver', 'final_decision', true]
] as const)('%s / %s = %s', (role, action, allowed) => {
  expect(moduleRoleAllows(role, action)).toBe(allowed);
});
```

Add cases for no session, inactive organisation, inactive membership, unlicensed module, no role, direct-link access and combined module-admin-plus-approver roles.

- [ ] **Step 2: Run tests and verify missing-export failures**

Run: `npm test -- tests/authz/resolver.test.ts`  
Expected: FAIL because the authorization modules do not exist.

- [ ] **Step 3: Implement a fail-closed permission map**

```ts
export const ROLE_ACTIONS: Record<ModuleRole, readonly ModuleAction[]> = {
  module_admin: ['view', 'edit', 'review', 'settings'],
  contributor: ['view', 'edit'],
  reviewer: ['view', 'review'],
  approver: ['view', 'review', 'final_decision'],
  viewer: ['view']
};

export function moduleRoleAllows(role: ModuleRole, action: ModuleAction): boolean {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}
```

`resolveAccess` evaluates checks in this order: valid session, active organisation, active membership, active licence, at least one module role, permitted action. Return `{ allowed: false, reason }` on the first failure and `{ allowed: true }` only when every check passes.

- [ ] **Step 4: Run unit and type checks**

Run: `npm test -- tests/authz && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add trustos-app/lib/authz trustos-app/tests/authz
git commit -m "feat: add fail-closed role resolver"
```

---

### Task 6: Add immutable security-audit recording and safe messages

**Files:**
- Create: `trustos-app/lib/audit/events.ts`
- Create: `trustos-app/lib/errors.ts`
- Create: `trustos-app/tests/audit/events.test.ts`
- Create via CLI: `supabase/migrations/<generated>_audit_append.sql`
- Create: `supabase/tests/audit_append.test.sql`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new audit_append --workdir ..
```

The CLI-generated timestamp must sort after all migrations from earlier tasks.

**Interfaces:**
- Consumes: server-only Supabase admin client and authorization denial reason codes.
- Produces: `recordAuditEvent(input: AuditEventInput): Promise<void>`, allowlisted `AuditEventType`, and `safeMessageFor(reason): string`.

- [ ] **Step 1: Write failing audit allowlist tests**

```ts
test('rejects secrets and oversized metadata', async () => {
  await expect(recordAuditEvent({
    eventType: 'sign_in_failed', outcome: 'denied', reasonCode: 'bad_credentials',
    metadata: { password: 'must-not-log' }
  })).rejects.toThrow('Audit metadata key is not allowed');
});

test('maps authorization denials to approved plain-language copy', () => {
  expect(safeMessageFor('no_module_role')).toBe(
    'You are signed in, but no TrustOS module has been assigned to your account.'
  );
});
```

- [ ] **Step 2: Run tests and verify failures**

Run: `npm test -- tests/audit/events.test.ts`  
Expected: FAIL because the audit modules do not exist.

- [ ] **Step 3: Implement the audit service**

Permit only metadata keys `source`, `changed_fields`, `retention_count` and `user_agent_family`; reject keys containing `password`, `token`, `secret`, `email_body` or `form_data`. Generate a request UUID when none is supplied. Insert synchronously for denied access and administrative mutations; throw if that required event cannot be stored.

- [ ] **Step 4: Prevent application mutation of audit rows**

The migration must revoke `insert`, `update`, `delete` and `truncate` from `anon` and `authenticated`; grant organisation-scoped `select` only; add a server-only append function; and add triggers that raise an exception on update or delete outside the retention function.

- [ ] **Step 5: Verify application immutability and safe copy**

Run:

```bash
npm test -- tests/audit
npx supabase test db --workdir supabase --file supabase/tests/audit_append.test.sql
```

Expected: PASS; authenticated update/delete assertions return permission errors.

- [ ] **Step 6: Commit**

```bash
git add trustos-app/lib/audit trustos-app/lib/errors.ts trustos-app/tests/audit supabase/migrations supabase/tests/audit_append.test.sql
git commit -m "feat: add protected access audit trail"
```

---

### Task 7: Build accessible sign-in, recovery and reset journeys

**Files:**
- Create: `trustos-app/components/error-summary.tsx`
- Create: `trustos-app/components/password-field.tsx`
- Create: `trustos-app/components/account-form.tsx`
- Create: `trustos-app/lib/actions/auth.ts`
- Create: `trustos-app/app/(auth)/sign-in/page.tsx`
- Create: `trustos-app/app/(auth)/forgot-password/page.tsx`
- Create: `trustos-app/app/(auth)/reset-password/page.tsx`
- Create: `trustos-app/app/api/auth/callback/route.ts`
- Create: `trustos-app/tests/auth/account-forms.test.tsx`
- Create: `trustos-app/tests/auth/actions.test.ts`

**Interfaces:**
- Consumes: Task 2 server client, Task 6 audit service and approved account copy.
- Produces: `signInAction`, `requestRecoveryAction`, `resetPasswordAction`, `signOutAction`, reusable labelled account forms and `/api/auth/callback`.

- [ ] **Step 1: Write failing accessible-form tests**

```tsx
test('sign-in has labels, password-manager hints and an announced error summary', () => {
  render(<SignInPage searchParams={Promise.resolve({ error: 'invalid' })} />);
  expect(screen.getByLabelText('Email address')).toHaveAttribute('autocomplete', 'email');
  expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  expect(screen.getByRole('alert')).toHaveTextContent('We could not sign you in');
  expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
});
```

Add a test that non-password email input survives validation failure, password input is not echoed, instructions precede errors, and recovery confirmation is identical for known and unknown email responses.

- [ ] **Step 2: Run tests and verify missing-page failures**

Run: `npm test -- tests/auth/account-forms.test.tsx`  
Expected: FAIL because account components and routes do not exist.

- [ ] **Step 3: Implement server actions with Zod validation**

Use schemas with normalized email and minimum 12-character new passwords. `signInAction` calls `signInWithPassword`, records success/failure without logging the password, validates a safe internal `next` path, and redirects only within the TrustOS origin. `requestRecoveryAction` always returns:

```text
If an account matches that email address, a password-recovery message has been sent.
```

`resetPasswordAction` updates the password, invokes global sign-out/session revocation, records `password_changed`, then returns to sign-in.

- [ ] **Step 4: Implement accessible forms and callback**

Use visible labels, `aria-describedby`, an error summary with `role="alert"` and `tabIndex={-1}`, field links, disabled-state text and a show-password button with `aria-pressed`. The callback exchanges the PKCE code and permits only `/accept-invitation`, `/reset-password` or `/app` as destinations.

- [ ] **Step 5: Verify actions and form accessibility**

Run: `npm test -- tests/auth && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add trustos-app/app trustos-app/components trustos-app/lib/actions/auth.ts trustos-app/tests/auth
git commit -m "feat: add accessible TrustOS account journeys"
```

---

### Task 8: Implement invitation acceptance and policy acknowledgement

**Files:**
- Create via CLI: `supabase/migrations/<generated>_invitation_acceptance.sql`
- Create: `supabase/tests/invitation_acceptance.test.sql`
- Create: `trustos-app/lib/actions/invitations.ts`
- Create: `trustos-app/app/(auth)/accept-invitation/page.tsx`
- Create: `trustos-app/tests/auth/invitation-acceptance.test.tsx`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new invitation_acceptance --workdir ..
```

The CLI-generated timestamp must sort after all migrations from earlier tasks.

**Interfaces:**
- Consumes: authenticated invited user, active application invitation, policy version constants and intended module roles.
- Produces: private transaction function `private.accept_invitation(uuid, text, text, text)` using `auth.uid()`, a `public.accept_invitation(uuid, text, text, text)` security-invoker wrapper, and `acceptInvitationAction(formData)`.

- [ ] **Step 1: Write failing transaction tests**

The pgTAP test must prove:

```sql
select lives_ok(
  $$select private.accept_invitation(
    'invitation-uuid', 'Fictional Administrator',
    'privacy-2026-08', 'terms-2026-08')$$,
  'valid invitation activates membership, roles and policy records atomically'
);
select throws_ok(
  $$select private.accept_invitation(
    'expired-invitation-uuid', 'Fictional Administrator',
    'privacy-2026-08', 'terms-2026-08')$$,
  'P0001', 'invitation_expired'
);
```

Add reused, superseded, wrong-email and unlicensed-module cases. Assert that every failure leaves zero partial membership or role rows.

- [ ] **Step 2: Run the database test and verify missing-function failure**

Run: `npx supabase test db --workdir supabase --file supabase/tests/invitation_acceptance.test.sql`  
Expected: FAIL because `private.accept_invitation` does not exist.

- [ ] **Step 3: Implement the transactional acceptance function**

Lock the invitation row `for update`; use `auth.uid()` and the authenticated Auth email inside the private function; require `pending`, unexpired and not superseded; upsert the validated 1-to-100-character display name; insert the membership, licensed role assignments and both policy acceptances; mark accepted; append `invitation_accepted`; and return the organisation UUID. The public wrapper is security invoker, accepts no user ID or role, and is granted only to `authenticated`; the security-definer implementation remains in `private` with an empty search path.

- [ ] **Step 4: Write and implement the accessible acceptance page**

The page shows organisation name, invited role and modules; never displays or trusts role values from the URL. It includes a visible Display name field, a 12-character password field, required privacy/terms acknowledgements with meaningful links, visible error summary and one “Activate my TrustOS account” button.

`acceptInvitationAction` first calls `supabase.auth.updateUser({ password })`, then invokes `public.accept_invitation` in the user's authenticated RLS context. If database acceptance fails, revoke the session and present the safe invitation error rather than leaving module access active.

- [ ] **Step 5: Verify all acceptance paths**

Run:

```bash
npm test -- tests/auth/invitation-acceptance.test.tsx
npx supabase test db --workdir supabase
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests/invitation_acceptance.test.sql trustos-app/lib/actions/invitations.ts trustos-app/app/'(auth)'/accept-invitation trustos-app/tests/auth/invitation-acceptance.test.tsx
git commit -m "feat: activate invited TrustOS accounts"
```

---

### Task 9: Build BeAccessible platform administration

**Files:**
- Create: `trustos-app/lib/actions/platform-admin.ts`
- Create: `trustos-app/scripts/bootstrap-platform-admin.ts`
- Create: `trustos-app/app/(protected)/app/admin/platform/page.tsx`
- Create: `trustos-app/tests/admin/platform-admin.test.ts`
- Modify: `trustos-app/lib/actions/invitations.ts`
- Create via CLI: `supabase/migrations/<generated>_platform_admin.sql`
- Create: `supabase/tests/platform_admin.test.sql`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new platform_admin --workdir ..
```

The CLI-generated timestamp must sort after all migrations from earlier tasks.

**Interfaces:**
- Consumes: active `private.platform_admins`, service-role server client and invitation service.
- Produces: `createOrganizationAction`, `setOrganizationModuleAction`, `inviteClientAdminAction`, `suspendOrganizationAction`.

- [ ] **Step 1: Write failing platform-authority tests**

```ts
test('rejects a JWT platform claim when the authoritative record is inactive', async () => {
  adminRecord.status = 'revoked';
  await expect(createOrganizationAction(validFormData)).rejects.toMatchObject({
    code: 'platform_admin_required'
  });
});

test('creates no organization when required audit append fails', async () => {
  auditInsert.mockRejectedValue(new Error('audit unavailable'));
  await expect(createOrganizationAction(validFormData)).rejects.toThrow('audit unavailable');
  expect(organizationInsert).toHaveBeenRolledBack();
});

test('platform authority does not grant operational module access', async () => {
  await expect(openModuleAsPlatformAdminWithoutModuleRole('trustops'))
    .rejects.toMatchObject({ code: 'no_module_role' });
});
```

- [ ] **Step 2: Run tests and verify missing-action failures**

Run: `npm test -- tests/admin/platform-admin.test.ts`  
Expected: FAIL because the action module does not exist.

- [ ] **Step 3: Implement server-only platform operations**

Every action must: authenticate; verify `app_metadata.platform_role === 'platform_admin'`; query active `private.platform_admins`; validate Zod input; run the database mutation and audit append transactionally; revalidate the platform page; return a plain-language result.

The server queries private authority through `public.verify_platform_admin(user_id)`, a security-invoker wrapper granted only to `service_role`. Organisation creation, suspension, licence changes and client-admin invitation each use the same exposed-wrapper/private-transaction pattern so mutation and required audit append succeed or roll back together.

`inviteClientAdminAction` cancels any prior pending invitation for the same normalized email and organisation, inserts a 72-hour invitation, calls `auth.admin.inviteUserByEmail(email, { redirectTo })`, and records `invitation_sent`. Never place an authorization role in Auth user metadata.

- [ ] **Step 4: Implement one secure initial-platform-admin bootstrap**

`bootstrap-platform-admin.ts` reads `PLATFORM_ADMIN_EMAIL` from server environment, creates or reuses an internal “BeAccessible Platform” organisation, creates a pending `private.platform_admins` row and a normal client-administrator invitation, then sends the existing 72-hour invitation. It never accepts an email argument on the command line and never prints the email or link.

When that specific invitation is accepted, the server action verifies the pending private record, updates Supabase `app_metadata.platform_role` to `platform_admin`, activates `private.platform_admins`, and records `platform_admin_activated`. The private active row remains authoritative, so partial setup or a stale token cannot grant platform access.

- [ ] **Step 5: Implement the accessible platform page**

Use separate named sections for organisation creation, module licensing and client-admin invitation. Use native checkboxes for TrustOps and GrantFlow, confirmation before suspension, visible success/error summaries and tables with proper column headings. No colour-only status.

- [ ] **Step 6: Verify server and database authority**

Run:

```bash
npm test -- tests/admin/platform-admin.test.ts
npx supabase test db --workdir supabase --file supabase/tests/platform_admin.test.sql
```

Expected: PASS; non-platform, pending and revoked administrators are denied, and the initial administrator receives authority only after accepting the invitation.

- [ ] **Step 7: Commit**

```bash
git add trustos-app/lib/actions/platform-admin.ts trustos-app/lib/actions/invitations.ts trustos-app/scripts/bootstrap-platform-admin.ts trustos-app/app/'(protected)'/app/admin/platform trustos-app/tests/admin supabase/migrations supabase/tests/platform_admin.test.sql
git commit -m "feat: add BeAccessible platform administration"
```

---

### Task 10: Build client team and module-role administration

**Files:**
- Create: `trustos-app/lib/actions/team-admin.ts`
- Create: `trustos-app/app/(protected)/app/admin/team/page.tsx`
- Create: `trustos-app/tests/admin/team-admin.test.ts`
- Create via CLI: `supabase/migrations/<generated>_team_admin.sql`
- Create: `supabase/tests/team_admin.test.sql`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new team_admin --workdir ..
```

The CLI-generated timestamp must sort after all migrations from earlier tasks.

**Interfaces:**
- Consumes: active `client_admin` membership and active organisation modules.
- Produces: `inviteTeamMemberAction`, `assignModuleRolesAction`, `removeTeamMemberAction`, `resendInvitationAction`.

- [ ] **Step 1: Write failing client-boundary tests**

```ts
test.each([
  ['another organization', otherOrgId, 'organization_forbidden'],
  ['an unlicensed module', ownOrgId, 'module_unlicensed'],
  ['client administrator role', ownOrgId, 'platform_admin_required']
])('client admin cannot assign %s', async (_label, organizationId, code) => {
  await expect(assignModuleRolesAction(formData({ organizationId })))
    .rejects.toMatchObject({ code });
});
```

Add tests for additive roles, removal revoking every module assignment, invitation resend superseding the earlier record and no module access being granted merely because the person is a client administrator.

- [ ] **Step 2: Run tests and verify missing-action failures**

Run: `npm test -- tests/admin/team-admin.test.ts`  
Expected: FAIL because team administration does not exist.

- [ ] **Step 3: Implement organisation-scoped actions**

Resolve the organisation from the authenticated membership rather than trusting a hidden field. Validate requested module IDs against active `organization_modules`. Permit invitations only with organisation role `team_member`. Role changes use a transaction that replaces the selected user's active module roles and appends one `module_role_changed` event containing only changed role names.

Removal deactivates membership and assignments, calls the server-only `public.revoke_user_sessions` security-invoker wrapper, and appends `membership_deactivated`. Every protected request and RLS policy also checks the Auth `session_id`, so an already-issued token is denied immediately after its session row is removed. Removal does not delete audit history or the Auth user, allowing a person who legitimately belongs to another organisation to be invited again there.

- [ ] **Step 4: Implement the accessible team page**

Render member and pending-invitation tables with headings, text status and module-role fieldsets. Each checkbox label includes module and role, such as “GrantFlow — Reviewer”. Removal uses a confirmation page naming the account and consequences; it is not a one-click icon.

- [ ] **Step 5: Verify application and RLS controls**

Run:

```bash
npm test -- tests/admin/team-admin.test.ts
npx supabase test db --workdir supabase --file supabase/tests/team_admin.test.sql
```

Expected: PASS, including cross-organisation and unlicensed-module denials.

- [ ] **Step 6: Commit**

```bash
git add trustos-app/lib/actions/team-admin.ts trustos-app/app/'(protected)'/app/admin/team trustos-app/tests/admin/team-admin.test.ts supabase/migrations supabase/tests/team_admin.test.sql
git commit -m "feat: add client team role administration"
```

---

### Task 11: Protect and integrate the existing TrustOps and GrantFlow modules

**Files:**
- Create: `trustos-app/legacy/trustops.html` from root `trustops.html`
- Create: `trustos-app/legacy/grantflow.html` from root `grantflow.html`
- Create: `trustos-app/components/module-shell.tsx`
- Create: `trustos-app/app/(protected)/app/page.tsx`
- Create: `trustos-app/app/(protected)/app/modules/[moduleId]/route.ts`
- Create: `trustos-app/tests/legacy/module-delivery.test.ts`
- Create: `trustos-app/tests/legacy/legacy-invariants.test.ts`
- Modify: `scripts/legacy-invariants.test.cjs`

**Interfaces:**
- Consumes: `resolveAccess`, active organisation licences/roles and unchanged legacy module HTML.
- Produces: protected `/app/modules/trustops`, `/app/modules/grantflow` and a persistent accessible module shell.

- [ ] **Step 1: Copy legacy sources without rewriting them**

Run:

```bash
cp trustops.html trustos-app/legacy/trustops.html
cp grantflow.html trustos-app/legacy/grantflow.html
```

Record SHA-256 hashes in the failing invariant test so accidental functional rewriting is visible.

- [ ] **Step 2: Write failing route and shell tests**

```ts
test('direct module route denies an unlicensed or roleless user', async () => {
  const response = await GET(requestFor('grantflow'), routeContext('grantflow'));
  expect(response.status).toBe(403);
  expect(await response.text()).not.toContain('GrantFlow AI');
});

test('licensed frames remain mounted while another module is selected', () => {
  render(<ModuleShell modules={twoModules} initialModule="trustops" />);
  expect(screen.getAllByTitle(/module/i)).toHaveLength(2);
});
```

- [ ] **Step 3: Run tests and verify missing-route failures**

Run: `npm test -- tests/legacy`  
Expected: FAIL because the protected route and shell do not exist.

- [ ] **Step 4: Implement protected HTML delivery**

Map only the literal IDs `trustops` and `grantflow` to server-side files; never concatenate a route parameter into a filesystem path. Resolve `view` access before reading the file. Return `Cache-Control: private, no-store`, `Content-Type: text/html; charset=utf-8`, and a 403 safe page on denial. Record denied direct access synchronously.

- [ ] **Step 5: Implement the accessible persistent shell**

Build module buttons from server-authorized data only. Use `aria-pressed`, the approved deep-blue selected state, visible focus, a polite status region and skip links. Render all licensed iframes once and toggle `hidden` so module state persists. Use sandbox `allow-scripts allow-popups`; do not add `allow-same-origin` unless a documented Phase 1 regression proves it necessary and the security review approves it.

- [ ] **Step 6: Run new and existing regression checks**

Run:

```bash
cd trustos-app && npm test -- tests/legacy && npm run build
cd .. && node --test scripts/*.test.cjs
```

Expected: new tests PASS; existing suite reports 31 pass, 0 fail, with only the known four local Chromium skips.

- [ ] **Step 7: Commit**

```bash
git add trustos-app/legacy trustos-app/components/module-shell.tsx trustos-app/app/'(protected)'/app trustos-app/tests/legacy scripts/legacy-invariants.test.cjs
git commit -m "feat: protect consolidated TrustOS modules"
```

---

### Task 12: Add session warnings, rate limits, security headers and retention

**Files:**
- Create: `trustos-app/components/session-timeout-warning.tsx`
- Create: `trustos-app/lib/security/session.ts`
- Create: `trustos-app/lib/security/rate-limit.ts`
- Create: `trustos-app/app/api/session/continue/route.ts`
- Create: `trustos-app/app/api/cron/audit-retention/route.ts`
- Create: `trustos-app/tests/security/session.test.tsx`
- Create: `trustos-app/tests/security/rate-limit.test.ts`
- Create: `trustos-app/tests/security/retention.test.ts`
- Create via CLI: `supabase/migrations/<generated>_security_operations.sql`
- Create: `supabase/tests/security_operations.test.sql`
- Modify: `trustos-app/next.config.ts`
- Modify: `trustos-app/lib/actions/auth.ts`
- Modify: `trustos-app/lib/actions/invitations.ts`
- Modify: `trustos-app/lib/supabase/proxy.ts`
- Create: `trustos-app/vercel.json`

Before editing SQL, run from `trustos-app/` and use the exact returned path:

```bash
npx supabase migration new security_operations --workdir ..
```

The CLI-generated timestamp must sort after all migrations from earlier tasks.

**Interfaces:**
- Consumes: authenticated session timestamps, hashed rate-limit subject, `CRON_SECRET` and audit retention categories.
- Produces: server-authoritative `private.app_sessions`, a 50-minute warning, 60-minute idle expiry, 12-hour maximum session, atomic `private.consume_rate_limit`, and protected daily retention endpoint.

- [ ] **Step 1: Write failing session and rate-limit tests**

```tsx
test('warns before idle expiry and permits a keyboard extension', async () => {
  vi.setSystemTime(new Date('2026-08-20T10:50:00Z'));
  render(<SessionTimeoutWarning lastActivity="2026-08-20T10:00:00Z" />);
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Your session will end in 10 minutes');
  await user.click(screen.getByRole('button', { name: 'Continue my session' }));
  expect(refreshSession).toHaveBeenCalled();
});
```

Add tests for no warning before 50 minutes, automatic sign-out at 60 minutes, absolute expiry at 12 hours, five recovery requests per hour and progressive sign-in delays without permanent lockout.

- [ ] **Step 2: Run tests and verify failures**

Run: `npm test -- tests/security`  
Expected: FAIL because security operations are not implemented.

- [ ] **Step 3: Implement atomic database rate limiting**

Store only an HMAC-SHA256 subject derived from normalized email plus a server secret; never store the email in the rate-limit table. `private.consume_rate_limit(bucket, subject_hash, window_seconds, limit_count)` increments atomically and returns `{ allowed, retry_after_seconds }`. A `public.consume_rate_limit` security-invoker wrapper is granted only to `service_role`; the security-definer implementation remains in `private`.

Use limits: sign-in 10 attempts per 15 minutes with progressive delay after five; recovery 5 per hour; invitation send/resend 10 per hour per administrator; privileged mutations 60 per hour per administrator.

- [ ] **Step 4: Implement session warning and fresh-auth enforcement**

Create `private.app_sessions` keyed by the Supabase Auth `session_id`, with `user_id`, `created_at`, `last_activity_at` and `revoked_at`. Sign-in and invitation acceptance register the session through a service-role-only public security-invoker wrapper. Each protected server request checks this record and updates `last_activity_at` no more than once per minute. RLS active-session helpers also require an unexpired app-session record.

Track activity without keystroke logging. Warn at 50 minutes with a focusable `role="alertdialog"`, provide “Continue my session” and “Sign out now”, and never reset the 12-hour maximum. The Continue route verifies the current Auth session and updates only its matching app-session row. `requireFreshSession` rejects role changes, removal and licence changes when authentication is older than 15 minutes. Expiry revokes the app-session record and Auth refresh session, clears cookies and redirects to sign-in with a plain-language message.

- [ ] **Step 5: Implement retention and headers**

The cron route requires `Authorization: Bearer ${CRON_SECRET}`, calls a private retention function and records counts only. Configure daily execution in `vercel.json`. Add CSP for self, required Supabase HTTPS/WSS endpoints and no unrestricted script sources; add HSTS, `X-Content-Type-Options: nosniff`, strict referrer policy, permissions policy and frame-ancestor restrictions.

- [ ] **Step 6: Verify security operations**

Run:

```bash
npm test -- tests/security
npx supabase test db --workdir supabase --file supabase/tests/security_operations.test.sql
npm run build
```

Expected: PASS; build output contains no secret values.

- [ ] **Step 7: Commit**

```bash
git add trustos-app/components/session-timeout-warning.tsx trustos-app/lib/security trustos-app/lib/actions/auth.ts trustos-app/lib/actions/invitations.ts trustos-app/lib/supabase/proxy.ts trustos-app/app/api/session trustos-app/app/api/cron trustos-app/tests/security trustos-app/next.config.ts trustos-app/vercel.json supabase/migrations supabase/tests/security_operations.test.sql
git commit -m "feat: harden TrustOS sessions and retention"
```

---

### Task 13: Add protected organisation audit viewing

**Files:**
- Create: `trustos-app/app/(protected)/app/audit/page.tsx`
- Create: `trustos-app/components/audit-table.tsx`
- Create: `trustos-app/tests/audit/audit-view.test.tsx`

**Interfaces:**
- Consumes: RLS-filtered `audit_events` and active client- or platform-administrator authority.
- Produces: accessible audit table with event, actor display name, outcome, reason and time; no mutation controls.

- [ ] **Step 1: Write the failing audit-view test**

```tsx
test('shows only the current organisation and exposes no edit control', async () => {
  render(await AuditPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole('table', { name: 'Access security events' })).toBeInTheDocument();
  expect(screen.getByText('Fictional Client A')).toBeInTheDocument();
  expect(screen.queryByText('Fictional Client B')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /edit|delete/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify missing-page failure**

Run: `npm test -- tests/audit/audit-view.test.tsx`  
Expected: FAIL because the audit page does not exist.

- [ ] **Step 3: Implement the server-rendered audit view**

Require client-admin or platform-admin authority, query through the user's RLS context for client admins, and use the authoritative platform path only for platform scope. Render text outcome as well as colour, ISO timestamps through `<time dateTime>`, descriptive table headers and pagination of 50 events. Do not expose raw metadata by default.

- [ ] **Step 4: Verify audit access and rendering**

Run: `npm test -- tests/audit && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add trustos-app/app/'(protected)'/app/audit trustos-app/components/audit-table.tsx trustos-app/tests/audit/audit-view.test.tsx
git commit -m "feat: add protected access audit view"
```

---

### Task 14: Add end-to-end accessibility, authorization and regression coverage

**Files:**
- Create: `trustos-app/playwright.config.ts`
- Create: `trustos-app/tests/e2e/account-journey.spec.ts`
- Create: `trustos-app/tests/e2e/tenant-isolation.spec.ts`
- Create: `trustos-app/tests/e2e/module-access.spec.ts`
- Create: `trustos-app/tests/e2e/accessibility.spec.ts`
- Create: `trustos-app/tests/e2e/helpers/test-users.ts`
- Create: `trustos-app/tests/e2e/helpers/supabase-fixtures.ts`

**Interfaces:**
- Consumes: a local or Vercel `E2E_BASE_URL`, two fictional organisations, platform admin, client admins and every module role.
- Produces: repeatable browser evidence for critical journeys and release-stop conditions.

- [ ] **Step 1: Configure non-skippable release browser tests**

Use Chromium and Firefox projects, `baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'`, screenshots only on failure, trace on first retry and no production data. CI must run `npx playwright install --with-deps chromium firefox`; missing browsers fail rather than skip.

- [ ] **Step 2: Write the failing account journey**

```ts
test('invited client administrator activates and signs in', async ({ page }) => {
  await page.goto(invitationUrl);
  await page.getByLabel('Display name').fill('Fictional Client Administrator');
  await page.getByLabel('Password').fill('Correct-Horse-Accessible-2026');
  await page.getByLabel(/privacy notice/i).check();
  await page.getByLabel(/account terms/i).check();
  await page.getByRole('button', { name: 'Activate my TrustOS account' }).click();
  await expect(page.getByRole('heading', { name: 'Your TrustOS modules' })).toBeVisible();
});
```

Add recovery, expired invite, reused invite, sign-out, removed membership and generic unknown-email confirmation.

- [ ] **Step 3: Write tenant and module security journeys**

For Client A, attempt Client B audit URL, member URL and direct GrantFlow URL. Expect 403-safe content, no Client B strings and a denied audit event. Test every role/action row from Task 5, unlicensed module, no role, suspended organisation and module state persistence.

- [ ] **Step 4: Write accessibility journeys**

Run axe on sign-in, invitation, shell, platform admin, team admin and audit pages. Keyboard-tab through each critical task and assert focus visibility. Set viewport to 320 CSS pixels and verify no horizontal overflow. Set 400% equivalent zoom/reflow, reduced motion and forced-colour mode. Assert the error summary receives focus and links to invalid fields.

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

- [ ] **Step 5: Run the full local release suite**

Run:

```bash
cd trustos-app
npm test
npm run typecheck
npm run build
npx playwright install chromium firefox
npm run test:e2e
cd ..
npx supabase test db --workdir supabase
node --test scripts/*.test.cjs
```

Expected: all unit, database and browser tests PASS; no browser skips.

- [ ] **Step 6: Commit**

```bash
git add trustos-app/playwright.config.ts trustos-app/tests/e2e
git commit -m "test: cover TrustOS identity access release"
```

---

### Task 15: Deploy and verify the protected Vercel preview

**Files:**
- Create: `trustos-app/docs/operations/preview-verification.md`
- Create: `trustos-app/docs/operations/rollback.md`
- Create: `trustos-app/docs/operations/account-support.md`
- Create: `trustos-app/app/accessibility/page.tsx`
- Create: `trustos-app/app/privacy/page.tsx`

**Interfaces:**
- Consumes: linked Supabase project, Vercel project `trustos-phase-1`, protected environment variables and the complete test suite.
- Produces: a non-production Vercel preview URL, database-advisor evidence, verification record and rollback instructions.

- [ ] **Step 1: Connect deployment services without exposing values**

Use the connected Supabase and Vercel integrations or authenticated CLIs. Link the existing Vercel project ID `prj_GN3tyne2FY4kgA3lW4jav8XI1vCI`. Configure Preview-only Supabase URL, publishable key, service-role key, cron secret, rate-limit HMAC key and initial platform-administrator email. Configure Supabase Auth custom SMTP to use the existing protected Resend credential, `smtp.resend.com`, sender `hello@beaccessible.co.za`, and the verified BeAccessible domain. Confirm Vercel variable names only:

```bash
vercel env ls preview
```

No command output may print an environment value.

- [ ] **Step 2: Apply migrations and run database checks**

Apply migrations through the Supabase migration mechanism, then run:

```bash
npx supabase db lint --linked --level warning
npx supabase test db --workdir supabase
```

Review Supabase security and performance advisors. Any Phase 2 security warning is a release stop; fix it through a new migration and rerun both checks.

- [ ] **Step 3: Write operational and public documentation**

The preview-verification record lists date, commit, preview URL, test commands and results. The rollback document specifies redeploying the last Phase 1 production commit and disabling Phase 2 invitations without deleting audit evidence. Account support documents invite resend, recovery, removal and `hello@beaccessible.co.za` escalation.

Update the privacy page with account data, purpose, recipients, 90-day and 24-month retention rules, POPIA rights and complaint route. Update the accessibility page with tested browsers/assistive technologies, known limitations and contact route; do not claim AAA.

- [ ] **Step 4: Deploy the preview**

Run from the repository root and capture the generated URL without editing it by hand:

```bash
TRUSTOS_PREVIEW_URL="$(vercel deploy --cwd trustos-app --yes | tail -n 1)"
case "$TRUSTOS_PREVIEW_URL" in https://*) ;; *) exit 1;; esac
printf '%s\n' "$TRUSTOS_PREVIEW_URL"
```

Expected: a unique HTTPS Preview URL. Do not run `vercel --prod` and do not change the current production alias.

- [ ] **Step 5: Run browser verification against the preview**

```bash
E2E_BASE_URL="$TRUSTOS_PREVIEW_URL" npm --prefix trustos-app run test:e2e
```

Also verify CSP/security headers, no browser-console errors, no network calls containing passwords/tokens, keyboard-only completion, NVDA with Firefox and Chrome on the critical account journeys, 400% reflow, reduced motion and the two-organisation denial matrix. Record the captured `TRUSTOS_PREVIEW_URL`, browser versions, assistive-technology results and limitations in the verification document before committing.

- [ ] **Step 6: Run final regression and secret scans**

```bash
cd trustos-app && npm test && npm run typecheck && npm run build
cd .. && npx supabase test db --workdir supabase
node --test scripts/*.test.cjs
git grep -nE 'service_role|SUPABASE_SERVICE_ROLE_KEY=|CRON_SECRET=' -- ':!docs/superpowers' ':!trustos-app/.env.example'
```

Expected: all tests PASS; grep finds only variable names in server-only source and no assigned secret values.

- [ ] **Step 7: Commit the verification evidence**

```bash
git add trustos-app/docs trustos-app/app/accessibility trustos-app/app/privacy
git commit -m "docs: record TrustOS Phase 2 preview readiness"
```

- [ ] **Step 8: Stop for production-release approval**

Report the preview URL, exact test counts, advisor results, accessibility evidence and remaining limitations. Production promotion and real client invitations require a separate explicit approval.

---

## Plan completion checklist

- [ ] Every task has a passing test and a focused commit.
- [ ] Root BeAccessible static pages remain unchanged.
- [ ] Phase 1 regression suite passes.
- [ ] Database schema, grants and RLS tests pass for two organisations.
- [ ] All critical account and admin journeys pass in deployed browsers without skips.
- [ ] Accessibility checks include keyboard, screen reader structure, focus, contrast, reflow, reduced motion and clear error recovery.
- [ ] Supabase security advisors contain no unresolved Phase 2 warning.
- [ ] Vercel preview is live while Phase 1 production remains unchanged.
- [ ] No real client is invited and no production promotion occurs without explicit approval.

## Primary technical references

- [Next.js 16 Proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Supabase server-side client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Data API security, grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase user-session controls](https://supabase.com/docs/guides/auth/sessions)
- [Supabase administrator invitations](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase advanced pgTAP and private security functions](https://supabase.com/docs/guides/local-development/testing/pgtap-extended)

## Accessibility Compliance Note

This implementation plan makes WCAG 2.2 Level AA a release requirement and includes feasible Level AAA measures. It specifies semantic structure, full keyboard operation, strong visible focus, accessible authentication, password-manager support, announced errors, timeout warnings, responsive reflow, reduced motion, non-colour-only meaning, large targets, low-effort workflows and deployed assistive-technology verification. Conformance remains unclaimed until the implemented preview completes automated, manual and disabled-user testing and all remaining limitations are documented.
