# Task 3 report: TrustOS identity, licence, invitation and audit schema

## Status

Task 3 schema/configuration/seed/pgTAP artifacts are implemented and committed on
`phase2/identity-access-design`:

```text
dfd938e2011312e316eace5f3a58ca55f662f1af feat: add TrustOS identity access schema
eebf879c76e759021e7af626e6112e4024609cac fix: preserve TrustOS migration contract
bee4ca2318282222375a4e52456c99c9f0a3f400 fix: disambiguate TrustOS pgTAP assertions
```

The controller verified database execution on disposable Supabase Postgres 17
branch `fmqxvxoxxmwmanftxdwl`: the schema migration applied successfully, all 12
corrected pgTAP assertions returned `ok`, the seed ran twice successfully with
stable final counts, and Supabase security advisors returned zero lints. The
controller successfully deleted disposable branch
`c85188b7-0401-47ed-abaa-b4ef562eefee` after verification, stopping its hourly
charge.

An independent reviewer returned **ACCEPT** with no Critical or Important
findings. Task 3 is complete and accepted; Task 4 is authorized to begin.

## Inputs reviewed

- Complete `task-3-brief.md`, approved Phase 2 specification and implementation
  plan (including downstream schema consumers), and the current progress ledger.
- Supabase CLI 2.115.0 top-level help and relevant `init`, `start`, `migration`,
  `migration new`, `test db`, `db reset`, `db lint`, `migration list`, `db query`
  and `status` help before use.
- Current Supabase changelog and official local development, CLI configuration,
  migration, seeding, pgTAP and linting documentation. The relevant 2026 breaking
  change is that new public tables are not automatically Data API-exposed; the
  generated config leaves `api.auto_expose_new_tables` unset, and Task 4 remains
  responsible for explicit grants and RLS.

## TDD and harness evidence

The 12 planned pgTAP assertions were added first in
`supabase/tests/identity_access_schema.test.sql`.

The local stack was then requested with the current CLI workdir semantics:

```text
$ SUPABASE_HOME=/tmp/trustos-task3-supabase \
  SUPABASE_NO_UPDATE_NOTIFIER=1 SUPABASE_TELEMETRY_DISABLED=1 \
  ./node_modules/.bin/supabase start --workdir ..
failed to inspect container health: docker: command not found
(podman also not found) — install Docker Desktop or Podman and ensure it is on PATH
```

The pre-migration pgTAP attempt could not reach a database:

```text
$ ... ./node_modules/.bin/supabase test db --workdir .. \
  supabase/tests/identity_access_schema.test.sql
exit 1
failed to connect to postgres ... ECONNREFUSED 127.0.0.1:54322
Make sure Docker is running, then run: supabase start
```

This is recorded as an infrastructure blocker, not a genuine RED. Per the Task 3
brief's static-progression contingency, implementation continued without claiming
database behavior.

The schema migration was created by the CLI, not by inventing its timestamp:

```text
$ ... ./node_modules/.bin/supabase migration new identity_access_schema --workdir ..
Migration created:
supabase/migrations/20260824061656_identity_access_schema.sql
```

### Review-fix RED/GREEN

Two focused static contract tests were written before addressing the review:

- the deployable schema migration must provision both canonical modules without
  embedding either fictional tenant;
- every downstream migration must have an explicit `supabase migration new`
  instruction and the plan must contain no stale `202608200002..007` path.

The genuine RED run was:

```text
$ node --test scripts/trustos-migration-contract.test.cjs
tests 2; pass 0; fail 2
missing canonical migration insert
missing CLI generation instruction for identity_access_rls
```

After the focused migration and plan changes:

```text
$ node --test scripts/trustos-migration-contract.test.cjs
tests 2; pass 2; fail 0
```

## Implementation

- Supabase local project configuration keeps email in local Mailpit, disables
  global and email open sign-up, and requires passwords of at least 12 characters.
- Added `private.platform_admins` and all ten public records required by the spec:
  `organizations`, `profiles`, `organization_memberships`, `module_catalog`,
  `organization_modules`, `module_role_assignments`, `invitations`,
  `invitation_module_roles`, `policy_acceptances`, and `audit_events`.
- Added constrained lifecycle, organisation-role, module-role, policy and audit
  outcome enum types. The module-role values match the approved permission model:
  `module_admin`, `contributor`, `reviewer`, `approver`, and `viewer`.
- UUID primary keys and `auth.users`, organisation, membership, catalogue and
  licence foreign keys prevent orphaned identity/access records. Role assignments
  must reference both the matching organisation membership and organisation
  module licence.
- Added all required uniqueness constraints and state/timestamp checks, including
  `expires_at > created_at` and accepted/superseded timestamp consistency.
- `invitations.email_normalized` uses `extensions.citext` and accepts only trimmed,
  lowercase normalized storage.
- `audit_events.metadata` is a JSON object, defaults to `{}`, and is limited by
  serialized UTF-8 size to 8,192 bytes.
- The deployable migration idempotently provisions fixed `trustops` and
  `grantflow` catalogue rows, so remote `db push` does not depend on seed execution.
- Seed data is marked local-only and harmlessly repeats the canonical rows before
  creating two fictional organisations and deterministic fictional module
  licences. Fictional tenants/licences occur only in seed; every seed insert is
  idempotent via `on conflict do nothing`, and no real people or credentials are used.
- The implementation plan now requires every downstream migration to be generated
  by the CLI when its task begins. It preserves each descriptive suffix, uses
  generated placeholders in file lists, and contains no executable reference to
  the earlier `202608200002..007` filenames.

## Verification evidence

Database commands were attempted after implementation and remain blocked:

```text
$ ... supabase db reset --workdir ..
exit 1: failed to inspect service

$ ... supabase test db --workdir .. supabase/tests/identity_access_schema.test.sql
exit 1: ECONNREFUSED 127.0.0.1:54322

$ ... supabase db lint --local --level warning --fail-on warning --workdir ..
exit 1: ECONNREFUSED 127.0.0.1:54322
```

Static configuration and artifact validation passed:

```text
config.toml: valid TOML; sign-up disabled; minimum password 12;
local SMTP and seed enabled
pgTAP plan: exactly 12 assertions
seed.sql: deterministic values; three idempotent inserts
git diff --cached --check: exit 0
```

Fresh application and regression verification passed:

```text
$ ./node_modules/.bin/vitest run
Test Files 6 passed (6); Tests 14 passed (14)

$ ./node_modules/.bin/tsc --noEmit
exit 0

$ ./node_modules/.bin/next build
Compiled successfully; TypeScript completed; 3/3 static pages generated

$ node --test scripts/*.test.cjs
tests 37; pass 33; fail 0; skipped 4
```

The four Phase 1 skips are the unchanged Chromium-dependent checks; Chromium is
not installed locally.

## Files

- `supabase/config.toml`
- `supabase/migrations/20260824061656_identity_access_schema.sql`
- `supabase/seed.sql`
- `supabase/tests/identity_access_schema.test.sql`
- `scripts/trustos-migration-contract.test.cjs`
- `docs/superpowers/plans/2026-08-20-trustos-phase-2-identity-access.md`

## Self-review

- A wrong role/status value is rejected by an enum; inconsistent lifecycle
  timestamps are rejected by named checks.
- Duplicate memberships, licences, module-role assignments and invitation roles
  are rejected by the exact composite uniqueness constraints in the plan.
- A role assignment for a person without the same-organisation membership or for
  a module without the same-organisation licence is rejected by composite foreign
  keys.
- Invitation acceptance after expiry is structurally preventable because the
  accepted timestamp must not exceed `expires_at`; the later Task 8 transaction
  remains responsible for checking current time and invitation state atomically.
- Empty/default audit metadata is valid; non-object metadata and payloads above
  exactly 8 KiB are rejected.
- Canonical module provisioning is migration-owned, while the static contract
  rejects either fictional tenant appearing in a deployable migration.
- All six downstream migration suffixes have explicit CLI generation commands;
  Task 4 additionally requires its returned timestamp to sort after the actual
  Task 3 migration and every existing migration.
- No grants, RLS policies, audit append functions or later-task schema were added;
  Task 4 and later remain untouched.

## Database GREEN and remaining release check

Controller-provided evidence from disposable branch `fmqxvxoxxmwmanftxdwl` after
cleaning the public schema and applying the migration:

- The schema migration applied successfully.
- The corrected explicit-schema pgTAP assertions returned all 12 `ok` results.
- `seed.sql` executed twice successfully; final counts remained
  `module_catalog=2`, `organizations=2`, and `organization_modules=3`, proving the
  seed is idempotent for these fixtures.
- Supabase security advisors returned zero lints.
- Performance advisors returned INFO only: unindexed foreign keys on several
  Task 3 tables and the inherited branch Auth absolute connection strategy. There
  were no warning/error security findings. Carry the foreign-key findings into
  Task 4's RLS/index design, including an index for
  `audit_events.organization_id` before data growth or preview release.

MCP cannot execute the CLI `db lint` command. Task 3 introduces no PL/pgSQL
functions, and the Supabase security advisor is clean, so the unavailable CLI lint
is nonblocking for Task 3. Retain CLI database lint in the GitHub/Docker release
checks. The controller successfully deleted disposable branch
`c85188b7-0401-47ed-abaa-b4ef562eefee` after verification; its hourly charge has
stopped.

The independent reviewer accepted Task 3 with no Critical or Important findings.
Task 4 is authorized to begin. Regenerate its brief from the corrected tracked plan
so it includes the CLI generation command, carries the INFO index findings into its
RLS/index design, and does not restore the stale
`202608200002_identity_access_rls.sql` instruction.

## Runtime pgTAP overload correction

A clean disposable Supabase Postgres 17 branch applied the migration successfully
and `pg_tables` confirmed that all expected tables exist. Its pgTAP run nevertheless
recorded the genuine runtime RED: assertions 2–11 failed because PostgreSQL resolved
the short calls as pgTAP's description overloads rather than its schema-aware
overloads. In particular, `has_table('public', 'organizations')` was interpreted as
`has_table(table, description)`, and
`col_is_pk('public', 'organizations', 'id')` as
`col_is_pk(table, column, description)`.

The focused correction adds an explicit description argument to all nine
schema/table `has_table` assertions and to the schema/table/column `col_is_pk`
assertion. `select plan(12)` and the other two assertions are unchanged.

The focused correction is committed as
`bee4ca2` (`fix: disambiguate TrustOS pgTAP assertions`). Fresh local evidence:

```text
pgTAP static contract: plan 12; has_table 9/9 schema-aware;
col_is_pk 1/1 schema-aware
Vitest: 6 files, 14/14 tests passed
TypeScript: tsc --noEmit exited 0
Next.js: production build completed, 3/3 static pages generated
Root regressions: 37 tests; 33 passed; 0 failed; 4 Chromium skips
git diff --cached --check: exit 0 before commit
```

The controller reran the corrected pgTAP file on branch project
`fmqxvxoxxmwmanftxdwl`; all 12 assertions returned `ok`.
