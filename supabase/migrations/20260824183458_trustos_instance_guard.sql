create or replace function private.assert_trustos_instance()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actual_product text;
  actual_ref text;
begin
  select product, supabase_project_ref
    into actual_product, actual_ref
  from private.instance_identity
  where singleton = true;

  if actual_product is distinct from 'trustos'
     or actual_ref is distinct from 'napjcycxzyrsruiifuca' then
    raise exception
      'TrustOS instance guard failed: expected product trustos on Supabase project napjcycxzyrsruiifuca, found product % on project %. Migration stopped.',
      coalesce(actual_product, '<missing>'),
      coalesce(actual_ref, '<missing>');
  end if;
end;
$$;

revoke all on function private.assert_trustos_instance() from public, anon, authenticated, service_role;
grant execute on function private.assert_trustos_instance() to postgres;

select private.assert_trustos_instance();

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
