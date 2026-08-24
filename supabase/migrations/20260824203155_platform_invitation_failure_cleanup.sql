select private.assert_trustos_instance();

create or replace function private.platform_cancel_invitation(
  actor_user uuid,
  target_invitation uuid,
  cancellation_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_row public.invitations%rowtype;
begin
  perform private.assert_trustos_instance();
  if not private.is_active_platform_admin(actor_user) then raise exception 'platform_admin_required'; end if;

  select i.* into invitation_row
  from public.invitations i
  where i.id = target_invitation
  for update;

  if not found or invitation_row.status <> 'pending' then return false; end if;

  update public.invitations
    set status='superseded', superseded_at=now()
    where id=target_invitation;

  perform private.append_audit_event(
    invitation_row.organization_id,actor_user,'invitation_superseded','invitation',target_invitation,null,
    'succeeded',left(coalesce(cancellation_reason,'delivery_failed'),100),gen_random_uuid(),
    jsonb_build_object('source','platform_admin')
  );
  return true;
end;
$$;
revoke all on function private.platform_cancel_invitation(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.platform_cancel_invitation(uuid,uuid,text) to service_role;

create or replace function public.trustos_platform_cancel_invitation(actor_user uuid,target_invitation uuid,cancellation_reason text)
returns boolean
language sql
security invoker
set search_path=''
as $$ select private.platform_cancel_invitation(actor_user,target_invitation,cancellation_reason); $$;
revoke all on function public.trustos_platform_cancel_invitation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.trustos_platform_cancel_invitation(uuid,uuid,text) to service_role;
