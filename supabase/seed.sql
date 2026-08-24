-- Local development and test fixtures only. Canonical modules are also
-- migration-owned; fictional tenants and licences must remain seed-only.

insert into public.module_catalog (id, name, status) values
  ('trustops', 'TrustOps Core', 'active'),
  ('grantflow', 'GrantFlow', 'active')
on conflict do nothing;

insert into public.organizations (id, name, status, created_at) values
  (
    '10000000-0000-4000-8000-000000000001',
    'Fictional Client A',
    'active',
    '2026-08-20T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Fictional Client B',
    'active',
    '2026-08-20T00:00:00Z'
  )
on conflict do nothing;

insert into public.organization_modules (
  id,
  organization_id,
  module_id,
  status,
  enabled_at
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'trustops',
    'active',
    '2026-08-20T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'grantflow',
    'active',
    '2026-08-20T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'trustops',
    'active',
    '2026-08-20T00:00:00Z'
  )
on conflict do nothing;
