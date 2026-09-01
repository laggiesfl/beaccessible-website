begin;

select plan(31);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.organizations'::regclass),
  'organizations has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.module_catalog'::regclass),
  'module_catalog has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.organization_memberships'::regclass),
  'organization_memberships has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.organization_modules'::regclass),
  'organization_modules has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.module_role_assignments'::regclass),
  'module_role_assignments has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.invitations'::regclass),
  'invitations has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.invitation_module_roles'::regclass),
  'invitation_module_roles has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.policy_acceptances'::regclass),
  'policy_acceptances has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  'audit_events has row level security enabled'
);
select ok(
  not has_table_privilege('anon', 'public.organizations', 'SELECT'),
  'anonymous users cannot read organizations'
);
select ok(
  not has_table_privilege('anon', 'public.organization_memberships', 'SELECT'),
  'anonymous users cannot read memberships'
);
select ok(
  not has_table_privilege('authenticated', 'private.platform_admins', 'SELECT'),
  'signed-in client users cannot read platform administrators'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'INSERT'),
  'signed-in client users cannot append security audit records directly'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.revoke_trustos_user_sessions(uuid)',
    'EXECUTE'
  ),
  'signed-in client users cannot revoke another user session'
);

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'admin-a@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'member-a@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'admin-b@example.test');

insert into auth.sessions (id, user_id, created_at, updated_at) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', now(), now()),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', now(), now()),
  ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', now(), now());

insert into public.profiles (user_id, display_name) values
  ('10000000-0000-0000-0000-000000000001', 'Fictional Admin A'),
  ('10000000-0000-0000-0000-000000000003', 'Fictional Team Member A'),
  ('20000000-0000-0000-0000-000000000002', 'Fictional Admin B');

insert into public.organizations (id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Fictional RLS Client A'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Fictional RLS Client B');

insert into public.organization_memberships (
  organization_id,
  user_id,
  organization_role
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'client_admin'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'team_member'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'client_admin');

insert into public.organization_modules (organization_id, module_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'trustops'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'trustops');

insert into public.module_role_assignments (
  organization_id,
  user_id,
  module_id,
  role,
  assigned_by
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'trustops', 'module_admin', '10000000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'trustops', 'viewer', '10000000-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'trustops', 'module_admin', '20000000-0000-0000-0000-000000000002');

insert into public.invitations (
  organization_id,
  email_normalized,
  organization_role,
  invited_by,
  expires_at
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'teammate-a@example.test', 'team_member', '10000000-0000-0000-0000-000000000001', now() + interval '7 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'teammate-b@example.test', 'team_member', '20000000-0000-0000-0000-000000000002', now() + interval '7 days');

insert into public.audit_events (
  organization_id,
  actor_user_id,
  event_type,
  outcome
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'fixture_event', 'succeeded'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'fixture_event', 'succeeded');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '10000000-0000-0000-0000-000000000001',
    'role', 'authenticated',
    'session_id', '11000000-0000-0000-0000-000000000001'
  )::text,
  true
);

select results_eq(
  $$select name from public.organizations order by name$$,
  $$values ('Fictional RLS Client A'::text)$$,
  'a client administrator can see only their active organisation'
);
select results_eq(
  $$select display_name from public.profiles order by display_name$$,
  $$values ('Fictional Admin A'::text), ('Fictional Team Member A'::text)$$,
  'a client administrator can see minimal profiles only within their organisation'
);
select results_eq(
  $$select count(*) from public.profiles where user_id = '20000000-0000-0000-0000-000000000002'$$,
  $$values (0::bigint)$$,
  'Client B profiles are hidden from Client A'
);
select results_eq(
  $$select count(*) from public.organization_memberships where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  $$values (0::bigint)$$,
  'Client B memberships are hidden from Client A'
);
select results_eq(
  $$select count(*) from public.invitations where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  $$values (0::bigint)$$,
  'Client B invitations are hidden from Client A'
);
select results_eq(
  $$select count(*) from public.module_role_assignments where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  $$values (0::bigint)$$,
  'Client B role assignments are hidden from Client A'
);
select results_eq(
  $$select count(*) from public.audit_events where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  $$values (0::bigint)$$,
  'Client B audit records are hidden from Client A'
);
select results_eq(
  $$select count(*) from public.audit_events$$,
  $$values (1::bigint)$$,
  'a client administrator sees only their own organisation audit records'
);
select results_eq(
  $$with changed as (
      update public.module_role_assignments
      set status = 'revoked', revoked_at = now()
      where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      returning id
    )
    select count(*) from changed$$,
  $$values (0::bigint)$$,
  'a client administrator cannot update another organisation role assignment'
);
select lives_ok(
  $$insert into public.module_role_assignments (
      organization_id,
      user_id,
      module_id,
      role,
      assigned_by
    ) values (
      'aaaaaaaa-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003',
      'trustops',
      'contributor',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  'a client administrator can assign a licensed role to an active team member in their own organisation'
);
select results_eq(
  $$select count(*)
    from public.module_role_assignments
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000003'
      and module_id = 'trustops'
      and role = 'contributor'$$,
  $$values (1::bigint)$$,
  'the permitted team-member role assignment is visible to the client administrator'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '10000000-0000-0000-0000-000000000003',
    'role', 'authenticated',
    'session_id', '11000000-0000-0000-0000-000000000003'
  )::text,
  true
);

select results_eq(
  $$select display_name from public.profiles order by display_name$$,
  $$values ('Fictional Team Member A'::text)$$,
  'an ordinary team member can see only their own profile'
);
select results_eq(
  $$select count(*) from public.invitations$$,
  $$values (0::bigint)$$,
  'an ordinary team member cannot read organisation invitations'
);
select results_eq(
  $$select count(*) from public.audit_events$$,
  $$values (0::bigint)$$,
  'an ordinary team member cannot read organisation audit records'
);

reset role;
set local role service_role;
select lives_ok(
  $$select public.revoke_trustos_user_sessions('10000000-0000-0000-0000-000000000003'::uuid)$$,
  'the service role can revoke a user session through the narrow wrapper'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '10000000-0000-0000-0000-000000000003',
    'role', 'authenticated',
    'session_id', '11000000-0000-0000-0000-000000000003'
  )::text,
  true
);
select results_eq(
  $$select count(*) from public.organizations$$,
  $$values (0::bigint)$$,
  'a revoked session is denied immediately by RLS'
);

reset role;
select * from finish();
rollback;
