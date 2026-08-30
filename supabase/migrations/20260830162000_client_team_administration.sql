select private.assert_trustos_instance();

create or replace function private.assert_client_admin(
  actor_user uuid,
  target_org uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_trustos_instance();

  if not exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = actor_user
      and m.organization_id = target_org
      and m.organization_role = 'client_admin'
      and m.status = 'active'
      and o.status = 'active'
  ) then
    raise exception 'client_admin_required';
  end if;
end;
$$;

revoke all on function private.assert_client_admin(uuid,uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.assert_client_admin(uuid,uuid) to service_role;

create or replace function public.trustos_client_create_team_invitation(
  actor_user uuid,
  target_org uuid,
  target_email text,
  target_roles jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
  normalized_email text := lower(btrim(target_email));
  role_row record;
begin
  perform private.assert_client_admin(actor_user, target_org);

  if normalized_email is null
     or char_length(normalized_email) not between 3 and 320
     or position('@' in normalized_email) <= 1 then
    raise exception 'invitation_email_invalid';
  end if;

  if jsonb_typeof(target_roles) <> 'array'
     or jsonb_array_length(target_roles) = 0 then
    raise exception 'invitation_roles_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(target_org::text || ':' || normalized_email)::bigint
  );

  update public.invitations
  set status = 'expired'
  where organization_id = target_org
    and email_normalized::text = normalized_email
    and status = 'pending'
    and expires_at <= now();

  if exists (
    select 1
    from public.invitations i
    where i.organization_id = target_org
      and i.email_normalized::text = normalized_email
      and i.status = 'pending'
      and i.expires_at > now()
  ) then
    raise exception 'invitation_already_pending';
  end if;

  if exists (
    select 1
    from auth.users u
    join public.organization_memberships m on m.user_id = u.id
    where lower(u.email) = normalized_email
      and m.organization_id = target_org
      and m.status = 'active'
  ) then
    raise exception 'member_already_active';
  end if;

  insert into public.invitations (
    organization_id,
    email_normalized,
    organization_role,
    invited_by,
    expires_at
  ) values (
    target_org,
    normalized_email,
    'team_member',
    actor_user,
    now() + interval '72 hours'
  ) returning id into invitation_id;

  for role_row in
    select value->>'module_id' as module_id, value->>'role' as role
    from jsonb_array_elements(target_roles)
  loop
    if role_row.module_id not in ('trustops', 'grantflow')
       or role_row.role not in ('module_admin','contributor','reviewer','approver','viewer') then
      raise exception 'invitation_role_invalid';
    end if;

    if not exists (
      select 1
      from public.organization_modules om
      where om.organization_id = target_org
        and om.module_id = role_row.module_id
        and om.status = 'active'
    ) then
      raise exception 'invitation_unlicensed_module';
    end if;

    insert into public.invitation_module_roles (
      invitation_id,
      module_id,
      role
    ) values (
      invitation_id,
      role_row.module_id,
      role_row.role::public.module_role
    ) on conflict do nothing;
  end loop;

  perform private.append_audit_event(
    target_org,
    actor_user,
    'invitation_sent',
    'invitation',
    invitation_id,
    null,
    'succeeded',
    null,
    gen_random_uuid(),
    jsonb_build_object(
      'source', 'client_team_admin',
      'changed_fields', jsonb_build_array('organization_role','module_roles')
    )
  );

  return invitation_id;
end;
$$;

revoke all on function public.trustos_client_create_team_invitation(uuid,uuid,text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.trustos_client_create_team_invitation(uuid,uuid,text,jsonb)
  to service_role;

create or replace function public.trustos_client_cancel_team_invitation(
  actor_user uuid,
  target_org uuid,
  target_invitation uuid,
  cancellation_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_client_admin(actor_user, target_org);

  update public.invitations
  set status = 'superseded', superseded_at = now()
  where id = target_invitation
    and organization_id = target_org
    and organization_role = 'team_member'
    and status = 'pending';

  if not found then
    raise exception 'invitation_not_pending';
  end if;

  perform private.append_audit_event(
    target_org,
    actor_user,
    'invitation_superseded',
    'invitation',
    target_invitation,
    null,
    'failed',
    left(coalesce(cancellation_reason, 'cancelled'), 100),
    gen_random_uuid(),
    jsonb_build_object('source', 'client_team_admin')
  );
end;
$$;

revoke all on function public.trustos_client_cancel_team_invitation(uuid,uuid,uuid,text)
  from public, anon, authenticated, service_role;
grant execute on function public.trustos_client_cancel_team_invitation(uuid,uuid,uuid,text)
  to service_role;

create or replace function public.trustos_client_set_module_role(
  actor_user uuid,
  target_org uuid,
  target_user uuid,
  target_module text,
  target_role public.module_role,
  target_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignment_id uuid;
begin
  perform private.assert_client_admin(actor_user, target_org);

  if target_module not in ('trustops', 'grantflow') then
    raise exception 'module_invalid';
  end if;

  if not exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org
      and m.user_id = target_user
      and m.status = 'active'
  ) then
    raise exception 'member_not_active';
  end if;

  if not exists (
    select 1
    from public.organization_modules om
    where om.organization_id = target_org
      and om.module_id = target_module
      and om.status = 'active'
  ) then
    raise exception 'module_not_licensed';
  end if;

  if target_enabled then
    insert into public.module_role_assignments (
      organization_id,user_id,module_id,role,status,assigned_by
    ) values (
      target_org,target_user,target_module,target_role,'active',actor_user
    )
    on conflict (organization_id,user_id,module_id,role)
    do update set
      status = 'active',
      revoked_at = null,
      assigned_by = excluded.assigned_by
    returning id into assignment_id;

    perform private.append_audit_event(
      target_org, actor_user, 'module_role_assigned',
      'module_role_assignment', assignment_id, target_module,
      'succeeded', null, gen_random_uuid(),
      jsonb_build_object('source','client_team_admin','changed_fields',jsonb_build_array('role','status'))
    );
  else
    update public.module_role_assignments
    set status = 'revoked', revoked_at = now()
    where organization_id = target_org
      and user_id = target_user
      and module_id = target_module
      and role = target_role
      and status = 'active'
    returning id into assignment_id;

    if assignment_id is not null then
      perform private.append_audit_event(
        target_org, actor_user, 'module_role_revoked',
        'module_role_assignment', assignment_id, target_module,
        'succeeded', null, gen_random_uuid(),
        jsonb_build_object('source','client_team_admin','changed_fields',jsonb_build_array('status'))
      );
    end if;
  end if;
end;
$$;

revoke all on function public.trustos_client_set_module_role(
  uuid,uuid,uuid,text,public.module_role,boolean
) from public, anon, authenticated, service_role;
grant execute on function public.trustos_client_set_module_role(
  uuid,uuid,uuid,text,public.module_role,boolean
) to service_role;

create or replace function public.trustos_client_deactivate_team_member(
  actor_user uuid,
  target_org uuid,
  target_user uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
begin
  perform private.assert_client_admin(actor_user, target_org);

  update public.organization_memberships
  set status = 'inactive', deactivated_at = now()
  where organization_id = target_org
    and user_id = target_user
    and organization_role = 'team_member'
    and status = 'active'
  returning id into membership_id;

  if membership_id is null then
    raise exception 'team_member_not_active';
  end if;

  update public.module_role_assignments
  set status = 'revoked', revoked_at = now()
  where organization_id = target_org
    and user_id = target_user
    and status = 'active';

  perform private.append_audit_event(
    target_org,
    actor_user,
    'membership_deactivated',
    'organization_membership',
    membership_id,
    null,
    'succeeded',
    null,
    gen_random_uuid(),
    jsonb_build_object(
      'source','client_team_admin',
      'changed_fields',jsonb_build_array('status','module_roles')
    )
  );
end;
$$;

revoke all on function public.trustos_client_deactivate_team_member(uuid,uuid,uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.trustos_client_deactivate_team_member(uuid,uuid,uuid)
  to service_role;
