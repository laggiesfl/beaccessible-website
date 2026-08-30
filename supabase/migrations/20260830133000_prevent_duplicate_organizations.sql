select private.assert_trustos_instance();

-- Remediate any active duplicate names before enforcing the invariant.
-- Duplicates are suspended and renamed rather than deleted so audit evidence remains intact.
do $$
declare
  duplicate_row record;
begin
  for duplicate_row in
    select id, name
    from (
      select
        o.id,
        o.name,
        row_number() over (
          partition by lower(btrim(o.name))
          order by o.created_at, o.id
        ) as duplicate_rank
      from public.organizations o
      where o.status = 'active'
    ) ranked
    where duplicate_rank > 1
  loop
    update public.organizations
    set
      name = left(btrim(duplicate_row.name), 160)
        || ' [archived duplicate ' || left(duplicate_row.id::text, 8) || ']',
      status = 'suspended',
      suspended_at = now()
    where id = duplicate_row.id;
    perform private.append_audit_event(
      duplicate_row.id,
      null,
      'administrative_action',
      'organization',
      duplicate_row.id,
      null,
      'succeeded',
      'duplicate_organization_remediation',
      gen_random_uuid(),
      jsonb_build_object(
        'source', 'migration',
        'changed_fields', jsonb_build_array('name', 'status', 'suspended_at')
      )
    );
  end loop;
end;
$$;

create unique index if not exists organizations_active_normalized_name_key
  on public.organizations ((lower(btrim(name))))
  where status = 'active';

create or replace function private.platform_create_organization(
  actor_user uuid,
  organization_name text,
  enable_trustops boolean,
  enable_grantflow boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
  normalized_name text;
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then
    raise exception 'platform_admin_required';
  end if;
  if organization_name is null
     or char_length(btrim(organization_name)) not between 1 and 200 then
    raise exception 'organization_name_invalid';
  end if;

  normalized_name := lower(btrim(organization_name));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(normalized_name)::bigint);

  if exists (
    select 1
    from public.organizations o
    where o.status = 'active'
      and lower(btrim(o.name)) = normalized_name
  ) then
    raise exception 'organization_exists';
  end if;

  insert into public.organizations (name)
  values (btrim(organization_name))
  returning id into org_id;
  perform private.append_audit_event(
    org_id, actor_user, 'organization_created', 'organization', org_id, null,
    'succeeded', null, gen_random_uuid(),
    jsonb_build_object('source', 'platform_admin', 'changed_fields', jsonb_build_array('name'))
  );

  if coalesce(enable_trustops, false) then
    insert into public.organization_modules (organization_id, module_id, status)
    values (org_id, 'trustops', 'active');
    perform private.append_audit_event(
      org_id, actor_user, 'module_enabled', 'organization_module', null, 'trustops',
      'succeeded', null, gen_random_uuid(), jsonb_build_object('source', 'platform_admin')
    );
  end if;

  if coalesce(enable_grantflow, false) then
    insert into public.organization_modules (organization_id, module_id, status)
    values (org_id, 'grantflow', 'active');
    perform private.append_audit_event(
      org_id, actor_user, 'module_enabled', 'organization_module', null, 'grantflow',
      'succeeded', null, gen_random_uuid(), jsonb_build_object('source', 'platform_admin')
    );
  end if;

  return org_id;
exception
  when unique_violation then
    raise exception 'organization_exists';
end;
$$;
revoke all on function private.platform_create_organization(uuid,text,boolean,boolean)
  from public, anon, authenticated, service_role;
grant execute on function private.platform_create_organization(uuid,text,boolean,boolean)
  to service_role;
