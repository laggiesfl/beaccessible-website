begin;

select plan(12);

select has_schema('private');
select has_table('public', 'organizations', 'public.organizations exists');
select has_table('public', 'organization_memberships', 'public.organization_memberships exists');
select has_table('public', 'organization_modules', 'public.organization_modules exists');
select has_table('public', 'module_role_assignments', 'public.module_role_assignments exists');
select has_table('public', 'invitations', 'public.invitations exists');
select has_table('public', 'invitation_module_roles', 'public.invitation_module_roles exists');
select has_table('public', 'policy_acceptances', 'public.policy_acceptances exists');
select has_table('public', 'audit_events', 'public.audit_events exists');
select has_table('private', 'platform_admins', 'private.platform_admins exists');
select col_is_pk('public', 'organizations', 'id', 'public.organizations.id is the primary key');
select results_eq(
  'select id from public.module_catalog order by id',
  $$values ('grantflow'::text), ('trustops'::text)$$
);

select * from finish();

rollback;
