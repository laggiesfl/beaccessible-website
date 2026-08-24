select private.assert_trustos_instance();

create or replace function private.bootstrap_platform_admin(target_user uuid,target_email text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  normalized_email extensions.citext;
  auth_email extensions.citext;
  platform_org uuid;
  invitation_id uuid;
  created_org boolean := false;
begin
  perform private.assert_trustos_instance();
  perform pg_advisory_xact_lock(hashtext('trustos-platform-admin-bootstrap'));

  if exists (select 1 from private.platform_admins p where p.status in ('pending','active')) then
    raise exception 'platform_bootstrap_already_configured';
  end if;

  normalized_email := lower(btrim(target_email))::extensions.citext;
  select lower(btrim(u.email))::extensions.citext into auth_email
  from auth.users u
  where u.id=target_user and u.email is not null and u.is_anonymous=false;
  if auth_email is null or normalized_email is null or auth_email <> normalized_email then
    raise exception 'platform_bootstrap_identity_mismatch';
  end if;

  select o.id into platform_org
  from public.organizations o
  where o.name='BeAccessible Platform' and o.status='active'
  order by o.created_at
  limit 1
  for update;

  if platform_org is null then
    insert into public.organizations(name,status) values ('BeAccessible Platform','active') returning id into platform_org;
    created_org := true;
  end if;

  insert into private.platform_admins(user_id,status) values(target_user,'pending');

  insert into public.invitations(organization_id,email_normalized,organization_role,invited_by,status,expires_at)
  values(platform_org,normalized_email,'client_admin',target_user,'pending',now()+interval '72 hours')
  returning id into invitation_id;

  if created_org then
    perform private.append_audit_event(platform_org,null,'organization_created','organization',platform_org,null,'succeeded','platform_bootstrap',gen_random_uuid(),jsonb_build_object('source','platform_admin_activation'));
  end if;
  perform private.append_audit_event(null,null,'administrative_action','platform_admin',target_user,null,'succeeded','platform_admin_bootstrap_pending',gen_random_uuid(),jsonb_build_object('source','platform_admin_activation'));
  perform private.append_audit_event(platform_org,null,'invitation_sent','invitation',invitation_id,null,'succeeded','platform_bootstrap',gen_random_uuid(),jsonb_build_object('source','platform_admin_activation'));

  return invitation_id;
end;
$$;
revoke all on function private.bootstrap_platform_admin(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.bootstrap_platform_admin(uuid,text) to service_role;

create or replace function public.bootstrap_trustos_platform_admin(target_user uuid,target_email text)
returns uuid
language sql
security invoker
set search_path=''
as $$ select private.bootstrap_platform_admin(target_user,target_email); $$;
revoke all on function public.bootstrap_trustos_platform_admin(uuid,text) from public,anon,authenticated;
grant execute on function public.bootstrap_trustos_platform_admin(uuid,text) to service_role;
