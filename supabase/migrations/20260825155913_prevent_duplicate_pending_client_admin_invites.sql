select private.assert_trustos_instance();

create or replace function private.platform_create_client_admin_invitation(
  actor_user uuid,
  target_org uuid,
  target_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email extensions.citext;
  new_invitation uuid;
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then
    raise exception 'platform_admin_required';
  end if;

  normalized_email := lower(btrim(target_email))::extensions.citext;
  if normalized_email is null
     or normalized_email::text !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'email_invalid';
  end if;

  if not exists (
    select 1
    from public.organizations o
    where o.id = target_org and o.status = 'active'
  ) then
    raise exception 'organization_inactive';
  end if;

  -- Serialize invitations for the same organisation/email pair so rapid
  -- repeat submissions cannot invalidate the first successfully sent invite.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(target_org::text),
    pg_catalog.hashtext(normalized_email::text)
  );

  if exists (
    select 1
    from public.invitations i
    where i.organization_id = target_org
      and i.email_normalized = normalized_email
      and i.status = 'pending'
  ) then
    raise exception 'invitation_already_pending';
  end if;

  insert into public.invitations (
    organization_id,
    email_normalized,
    organization_role,
    invited_by,
    status,
    expires_at
  )
  values (
    target_org,
    normalized_email,
    'client_admin',
    actor_user,
    'pending',
    now() + interval '72 hours'
  )
  returning id into new_invitation;

  perform private.append_audit_event(
    target_org,
    actor_user,
    'invitation_sent',
    'invitation',
    new_invitation,
    null,
    'succeeded',
    null,
    gen_random_uuid(),
    jsonb_build_object('source','platform_admin')
  );

  return new_invitation;
end;
$$;
