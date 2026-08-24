select private.assert_trustos_instance();

create or replace function private.accept_invitation(
  target_user uuid,
  invitation_id uuid,
  display_name text,
  privacy_version text,
  terms_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_row public.invitations%rowtype;
  authenticated_email extensions.citext;
  org_id uuid;
  role_row record;
begin
  perform private.assert_trustos_instance();

  if target_user is null then raise exception 'invitation_user_missing'; end if;
  if display_name is null or char_length(btrim(display_name)) not between 1 and 100 then raise exception 'display_name_invalid'; end if;
  if privacy_version is null or char_length(btrim(privacy_version)) not between 1 and 100
     or terms_version is null or char_length(btrim(terms_version)) not between 1 and 100 then
    raise exception 'policy_version_invalid';
  end if;

  select lower(btrim(u.email))::extensions.citext
    into authenticated_email
  from auth.users u
  where u.id = target_user and u.email is not null and u.is_anonymous = false;
  if authenticated_email is null then raise exception 'invitation_user_invalid'; end if;

  select i.* into invitation_row
  from public.invitations i
  where i.id = invitation_id
  for update;
  if not found then raise exception 'invitation_not_found'; end if;

  if invitation_row.status = 'accepted' then raise exception 'invitation_already_used'; end if;
  if invitation_row.status = 'superseded' then raise exception 'invitation_superseded'; end if;
  if invitation_row.status <> 'pending' then raise exception 'invitation_not_pending'; end if;
  if invitation_row.expires_at <= now() then raise exception 'invitation_expired'; end if;
  if invitation_row.email_normalized <> authenticated_email then raise exception 'invitation_wrong_email'; end if;

  if not exists (
    select 1 from public.organizations o
    where o.id = invitation_row.organization_id and o.status = 'active'
  ) then raise exception 'invitation_organization_inactive'; end if;

  if exists (
    select 1
    from public.invitation_module_roles imr
    left join public.organization_modules om
      on om.organization_id = invitation_row.organization_id
     and om.module_id = imr.module_id
     and om.status = 'active'
    where imr.invitation_id = invitation_row.id and om.id is null
  ) then raise exception 'invitation_unlicensed_module'; end if;

  insert into public.profiles (user_id, display_name)
  values (target_user, btrim(display_name))
  on conflict (user_id) do update
    set display_name = excluded.display_name, updated_at = now();

  insert into public.organization_memberships (organization_id,user_id,organization_role,status)
  values (invitation_row.organization_id,target_user,invitation_row.organization_role,'active')
  on conflict (organization_id, user_id) do update
    set organization_role = excluded.organization_role, status = 'active', deactivated_at = null;

  for role_row in
    select imr.module_id, imr.role
    from public.invitation_module_roles imr
    where imr.invitation_id = invitation_row.id
  loop
    insert into public.module_role_assignments (organization_id,user_id,module_id,role,status,assigned_by)
    values (invitation_row.organization_id,target_user,role_row.module_id,role_row.role,'active',invitation_row.invited_by)
    on conflict (organization_id, user_id, module_id, role) do update
      set status = 'active', revoked_at = null, assigned_by = excluded.assigned_by;
  end loop;

  insert into public.policy_acceptances (user_id,organization_id,policy_type,policy_version)
  values
    (target_user, invitation_row.organization_id, 'privacy_notice', btrim(privacy_version)),
    (target_user, invitation_row.organization_id, 'account_terms', btrim(terms_version))
  on conflict do nothing;

  update public.invitations set status = 'accepted', accepted_at = now() where id = invitation_row.id;

  perform private.append_audit_event(
    invitation_row.organization_id,target_user,'invitation_accepted','invitation',invitation_row.id,
    null,'succeeded',null,gen_random_uuid(),jsonb_build_object('source','invitation_acceptance')
  );

  org_id := invitation_row.organization_id;
  return org_id;
end;
$$;

revoke all on function private.accept_invitation(uuid,uuid,text,text,text)
  from public, anon, authenticated, service_role;
grant execute on function private.accept_invitation(uuid,uuid,text,text,text) to service_role;
