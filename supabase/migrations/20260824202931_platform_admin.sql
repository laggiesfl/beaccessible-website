select private.assert_trustos_instance();

create or replace function private.is_active_platform_admin(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user is not null and exists (
    select 1 from private.platform_admins p
    where p.user_id = target_user and p.status = 'active'
  );
$$;
revoke all on function private.is_active_platform_admin(uuid) from public, anon, authenticated;
grant execute on function private.is_active_platform_admin(uuid) to service_role;

create or replace function public.verify_platform_admin(target_user uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.is_active_platform_admin(target_user);
$$;
revoke all on function public.verify_platform_admin(uuid) from public, anon, authenticated;
grant execute on function public.verify_platform_admin(uuid) to service_role;

create or replace function private.platform_admin_status(target_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.status::text from private.platform_admins p where p.user_id = target_user;
$$;
revoke all on function private.platform_admin_status(uuid) from public, anon, authenticated;
grant execute on function private.platform_admin_status(uuid) to service_role;

create or replace function public.trustos_platform_admin_status(target_user uuid)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.platform_admin_status(target_user);
$$;
revoke all on function public.trustos_platform_admin_status(uuid) from public, anon, authenticated;
grant execute on function public.trustos_platform_admin_status(uuid) to service_role;

create or replace function private.activate_platform_admin(target_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed boolean := false;
begin
  perform private.assert_trustos_instance();
  update private.platform_admins
    set status = 'active'
    where user_id = target_user and status = 'pending';
  changed := found;
  if changed then
    perform private.append_audit_event(
      null,target_user,'administrative_action','platform_admin',target_user,null,
      'succeeded','platform_admin_activated',gen_random_uuid(),
      jsonb_build_object('source','platform_admin_activation')
    );
  end if;
  return changed;
end;
$$;
revoke all on function private.activate_platform_admin(uuid) from public, anon, authenticated, service_role;
grant execute on function private.activate_platform_admin(uuid) to service_role;

create or replace function public.activate_trustos_platform_admin(target_user uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.activate_platform_admin(target_user);
$$;
revoke all on function public.activate_trustos_platform_admin(uuid) from public, anon, authenticated;
grant execute on function public.activate_trustos_platform_admin(uuid) to service_role;

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
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then raise exception 'platform_admin_required'; end if;
  if organization_name is null or char_length(btrim(organization_name)) not between 1 and 200 then raise exception 'organization_name_invalid'; end if;

  insert into public.organizations (name) values (btrim(organization_name)) returning id into org_id;
  perform private.append_audit_event(org_id,actor_user,'organization_created','organization',org_id,null,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin','changed_fields',jsonb_build_array('name')));

  if coalesce(enable_trustops,false) then
    insert into public.organization_modules (organization_id,module_id,status) values (org_id,'trustops','active');
    perform private.append_audit_event(org_id,actor_user,'module_enabled','organization_module',null,'trustops','succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  end if;
  if coalesce(enable_grantflow,false) then
    insert into public.organization_modules (organization_id,module_id,status) values (org_id,'grantflow','active');
    perform private.append_audit_event(org_id,actor_user,'module_enabled','organization_module',null,'grantflow','succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  end if;
  return org_id;
end;
$$;
revoke all on function private.platform_create_organization(uuid,text,boolean,boolean) from public,anon,authenticated,service_role;
grant execute on function private.platform_create_organization(uuid,text,boolean,boolean) to service_role;

create or replace function public.trustos_platform_create_organization(actor_user uuid,organization_name text,enable_trustops boolean,enable_grantflow boolean)
returns uuid language sql security invoker set search_path = '' as $$
  select private.platform_create_organization(actor_user,organization_name,enable_trustops,enable_grantflow);
$$;
revoke all on function public.trustos_platform_create_organization(uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.trustos_platform_create_organization(uuid,text,boolean,boolean) to service_role;

create or replace function private.platform_set_module(actor_user uuid,target_org uuid,target_module text,target_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then raise exception 'platform_admin_required'; end if;
  if target_module not in ('trustops','grantflow') then raise exception 'module_invalid'; end if;
  if not exists (select 1 from public.organizations o where o.id=target_org) then raise exception 'organization_not_found'; end if;

  if target_enabled then
    insert into public.organization_modules (organization_id,module_id,status,enabled_at,disabled_at)
    values (target_org,target_module,'active',now(),null)
    on conflict (organization_id,module_id) do update set status='active',enabled_at=now(),disabled_at=null;
    perform private.append_audit_event(target_org,actor_user,'module_enabled','organization_module',null,target_module,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  else
    update public.organization_modules set status='inactive',disabled_at=now() where organization_id=target_org and module_id=target_module;
    if not found then raise exception 'module_not_enabled'; end if;
    perform private.append_audit_event(target_org,actor_user,'module_disabled','organization_module',null,target_module,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  end if;
end;
$$;
revoke all on function private.platform_set_module(uuid,uuid,text,boolean) from public,anon,authenticated,service_role;
grant execute on function private.platform_set_module(uuid,uuid,text,boolean) to service_role;

create or replace function public.trustos_platform_set_module(actor_user uuid,target_org uuid,target_module text,target_enabled boolean)
returns void language sql security invoker set search_path='' as $$ select private.platform_set_module(actor_user,target_org,target_module,target_enabled); $$;
revoke all on function public.trustos_platform_set_module(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.trustos_platform_set_module(uuid,uuid,text,boolean) to service_role;

create or replace function private.platform_create_client_admin_invitation(actor_user uuid,target_org uuid,target_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  normalized_email extensions.citext;
  new_invitation uuid;
  old_invitation uuid;
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then raise exception 'platform_admin_required'; end if;
  normalized_email := lower(btrim(target_email))::extensions.citext;
  if normalized_email is null or normalized_email::text !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'email_invalid'; end if;
  if not exists (select 1 from public.organizations o where o.id=target_org and o.status='active') then raise exception 'organization_inactive'; end if;

  for old_invitation in
    select i.id from public.invitations i
    where i.organization_id=target_org and i.email_normalized=normalized_email and i.status='pending'
    for update
  loop
    update public.invitations set status='superseded',superseded_at=now() where id=old_invitation;
    perform private.append_audit_event(target_org,actor_user,'invitation_superseded','invitation',old_invitation,null,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  end loop;

  insert into public.invitations (organization_id,email_normalized,organization_role,invited_by,status,expires_at)
  values (target_org,normalized_email,'client_admin',actor_user,'pending',now()+interval '72 hours')
  returning id into new_invitation;
  perform private.append_audit_event(target_org,actor_user,'invitation_sent','invitation',new_invitation,null,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
  return new_invitation;
end;
$$;
revoke all on function private.platform_create_client_admin_invitation(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.platform_create_client_admin_invitation(uuid,uuid,text) to service_role;

create or replace function public.trustos_platform_create_client_admin_invitation(actor_user uuid,target_org uuid,target_email text)
returns uuid language sql security invoker set search_path='' as $$ select private.platform_create_client_admin_invitation(actor_user,target_org,target_email); $$;
revoke all on function public.trustos_platform_create_client_admin_invitation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.trustos_platform_create_client_admin_invitation(uuid,uuid,text) to service_role;

create or replace function private.platform_suspend_organization(actor_user uuid,target_org uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then raise exception 'platform_admin_required'; end if;
  update public.organizations set status='suspended',suspended_at=now() where id=target_org and status='active';
  if not found then raise exception 'organization_not_active'; end if;
  perform private.append_audit_event(target_org,actor_user,'organization_suspended','organization',target_org,null,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','platform_admin'));
end;
$$;
revoke all on function private.platform_suspend_organization(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.platform_suspend_organization(uuid,uuid) to service_role;

create or replace function public.trustos_platform_suspend_organization(actor_user uuid,target_org uuid)
returns void language sql security invoker set search_path='' as $$ select private.platform_suspend_organization(actor_user,target_org); $$;
revoke all on function public.trustos_platform_suspend_organization(uuid,uuid) from public,anon,authenticated;
grant execute on function public.trustos_platform_suspend_organization(uuid,uuid) to service_role;
