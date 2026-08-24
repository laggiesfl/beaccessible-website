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
select results_eq(
  'select id from public.module_catalog order by id',
  $$values ('grantflow'::text), ('trustops'::text)$$
);

select * from finish();

rollback;
