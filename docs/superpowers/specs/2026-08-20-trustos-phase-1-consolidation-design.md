# TrustOS Phase 1 Consolidation Design

## Purpose

Create one TrustOS entry point while preserving the existing TrustOps and GrantFlow demonstrations. Phase 1 establishes product structure and safe module separation; it does not pretend that the prototypes already share production infrastructure.

## Product structure

| TrustOS module | Existing source | Preserved scope | Licensing unit |
|---|---|---|---|
| TrustOps Core | `trustops.html` | Dashboard, projects, finance, approvals, impact and M&E, documents, demo sign-in | Independent module |
| GrantFlow | `grantflow.html` | Intake, applications, assessment, adjudication, contracting, payments, monitoring, applicant portal | Independent module |

The `trustos.html` shell reads a small catalogue and licence configuration, exposes only licensed modules as actions, and opens each existing product in a sandboxed frame. A full-page alternative remains available.

## Phase 1 boundaries

- Keep the two legacy documents isolated to avoid CSS, DOM ID, and JavaScript collisions.
- Preserve existing standalone URLs and in-memory workflows.
- Make demo-only behaviour, sample data, privacy constraints, and accessibility status explicit.
- Treat client-side licence filtering as a presentation prototype, not server-side entitlement enforcement.
- Do not claim shared authentication, shared live data, automated AI decisioning, formal WCAG conformance, or completed POPIA compliance.

## Later phases

Shared identity and roles, a common data model and audit trail, server-enforced entitlements, secure persistence, workflow integration, migration, and production accessibility/privacy assurance remain later-phase work.
