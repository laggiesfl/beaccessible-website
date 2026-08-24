begin;

select plan(12);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.organizations'::regclass),
  'organizations has row level security enabled'
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

select * from finish();
rollback;
