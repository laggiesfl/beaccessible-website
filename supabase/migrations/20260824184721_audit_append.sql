select private.assert_trustos_instance();

revoke insert, update, delete, truncate on public.audit_events from service_role;

create or replace function private.append_audit_event(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_target_type text,
  p_target_id uuid,
  p_module_id text,
  p_outcome text,
  p_reason_code text,
  p_request_id uuid,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
  metadata_key text;
  normalized_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  perform private.assert_trustos_instance();

  if p_event_type is null or p_event_type not in (
    'invitation_sent',
    'invitation_resent',
    'invitation_superseded',
    'invitation_accepted',
    'invitation_expired',
    'sign_in_succeeded',
    'sign_in_failed',
    'password_recovery_requested',
    'password_changed',
    'session_revoked',
    'organization_created',
    'organization_activated',
    'organization_suspended',
    'organization_restored',
    'module_enabled',
    'module_disabled',
    'membership_added',
    'membership_changed',
    'membership_deactivated',
    'membership_restored',
    'organization_role_assigned',
    'organization_role_changed',
    'organization_role_revoked',
    'module_role_assigned',
    'module_role_changed',
    'module_role_revoked',
    'protected_module_entered',
    'access_denied',
    'administrative_action',
    'retention_completed'
  ) then
    raise exception 'Audit event type is not allowed';
  end if;

  if p_outcome is null or p_outcome not in ('succeeded', 'denied', 'failed') then
    raise exception 'Audit outcome is not allowed';
  end if;

  if jsonb_typeof(normalized_metadata) <> 'object' then
    raise exception 'Audit metadata must be an object';
  end if;

  if octet_length(normalized_metadata::text) > 8192 then
    raise exception 'Audit metadata exceeds 8 KiB';
  end if;

  for metadata_key in select jsonb_object_keys(normalized_metadata)
  loop
    if metadata_key not in ('source', 'changed_fields', 'retention_count', 'user_agent_family')
       or lower(metadata_key) like '%password%'
       or lower(metadata_key) like '%token%'
       or lower(metadata_key) like '%secret%'
       or lower(metadata_key) like '%email_body%'
       or lower(metadata_key) like '%form_data%' then
      raise exception 'Audit metadata key is not allowed';
    end if;
  end loop;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    target_type,
    target_id,
    module_id,
    outcome,
    reason_code,
    request_id,
    metadata
  ) values (
    p_organization_id,
    p_actor_user_id,
    p_event_type,
    p_target_type,
    p_target_id,
    p_module_id,
    p_outcome::public.audit_outcome,
    p_reason_code,
    coalesce(p_request_id, gen_random_uuid()),
    normalized_metadata
  )
  returning id into event_id;

  return event_id;
end;
$$;

revoke all on function private.append_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function private.append_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)
  to service_role;

create or replace function public.append_trustos_audit_event(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_target_type text,
  p_target_id uuid,
  p_module_id text,
  p_outcome text,
  p_reason_code text,
  p_request_id uuid,
  p_metadata jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.append_audit_event(
    p_organization_id,
    p_actor_user_id,
    p_event_type,
    p_target_type,
    p_target_id,
    p_module_id,
    p_outcome,
    p_reason_code,
    p_request_id,
    p_metadata
  );
$$;

revoke all on function public.append_trustos_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.append_trustos_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)
  to service_role;

create or replace function private.protect_audit_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'postgres'
     and current_setting('trustos.audit_retention', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    elsif tg_op = 'UPDATE' then
      return new;
    else
      return null;
    end if;
  end if;

  raise exception 'Audit events are immutable';
end;
$$;

revoke all on function private.protect_audit_event_mutation() from public, anon, authenticated, service_role;

drop trigger if exists protect_audit_events_update_delete on public.audit_events;
create trigger protect_audit_events_update_delete
before update or delete on public.audit_events
for each row execute function private.protect_audit_event_mutation();

drop trigger if exists protect_audit_events_truncate on public.audit_events;
create trigger protect_audit_events_truncate
before truncate on public.audit_events
for each statement execute function private.protect_audit_event_mutation();
