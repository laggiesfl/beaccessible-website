select private.assert_trustos_instance();

create table private.app_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint app_sessions_activity_after_create check (last_activity_at >= created_at),
  constraint app_sessions_revoked_after_create check (revoked_at is null or revoked_at >= created_at)
);
create index app_sessions_user_active_idx on private.app_sessions(user_id, revoked_at, last_activity_at);
revoke all on private.app_sessions from public, anon, authenticated;
grant select, insert, update, delete on private.app_sessions to service_role;

create table private.rate_limit_buckets (
  bucket text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (bucket, subject_hash)
);
revoke all on private.rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on private.rate_limit_buckets to service_role;

create or replace function private.register_app_session(target_session uuid, target_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into private.app_sessions(session_id,user_id)
  values (target_session,target_user)
  on conflict (session_id) do update set revoked_at=null,last_activity_at=now();
$$;
revoke all on function private.register_app_session(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.register_app_session(uuid,uuid) to service_role;

create or replace function public.register_trustos_app_session(target_session uuid,target_user uuid)
returns void language sql security invoker set search_path='' as $$
  select private.register_app_session(target_session,target_user);
$$;
revoke all on function public.register_trustos_app_session(uuid,uuid) from public,anon,authenticated;
grant execute on function public.register_trustos_app_session(uuid,uuid) to service_role;

create or replace function private.touch_app_session(target_session uuid,target_user uuid)
returns table(created_at timestamptz,last_activity_at timestamptz) language plpgsql security definer set search_path='' as $$
begin
  update private.app_sessions s
     set last_activity_at=case when s.last_activity_at < now()-interval '1 minute' then now() else s.last_activity_at end
   where s.session_id=target_session and s.user_id=target_user and s.revoked_at is null
     and s.created_at > now()-interval '12 hours' and s.last_activity_at > now()-interval '60 minutes';
  return query select s.created_at,s.last_activity_at from private.app_sessions s
   where s.session_id=target_session and s.user_id=target_user and s.revoked_at is null
     and s.created_at > now()-interval '12 hours' and s.last_activity_at > now()-interval '60 minutes';
end;
$$;
revoke all on function private.touch_app_session(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.touch_app_session(uuid,uuid) to service_role;

create or replace function public.touch_trustos_app_session(target_session uuid,target_user uuid)
returns table(created_at timestamptz,last_activity_at timestamptz) language sql security invoker set search_path='' as $$
  select * from private.touch_app_session(target_session,target_user);
$$;
revoke all on function public.touch_trustos_app_session(uuid,uuid) from public,anon,authenticated;
grant execute on function public.touch_trustos_app_session(uuid,uuid) to service_role;

create or replace function private.is_active_session(target_session uuid,target_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select target_session is not null and target_user is not null and (select auth.uid())=target_user
    and exists(select 1 from auth.sessions s where s.id=target_session and s.user_id=target_user and (s.not_after is null or s.not_after>now()))
    and exists(select 1 from private.app_sessions a where a.session_id=target_session and a.user_id=target_user
      and a.revoked_at is null and a.created_at>now()-interval '12 hours' and a.last_activity_at>now()-interval '60 minutes');
$$;
revoke all on function private.is_active_session(uuid,uuid) from public,anon,authenticated;
grant execute on function private.is_active_session(uuid,uuid) to authenticated;

create or replace function private.revoke_user_sessions(target_user uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare deleted_count integer;
begin
  update private.app_sessions set revoked_at=coalesce(revoked_at,now()) where user_id=target_user;
  delete from auth.sessions where user_id=target_user;
  get diagnostics deleted_count=row_count;
  return deleted_count;
end;
$$;
revoke all on function private.revoke_user_sessions(uuid) from public,anon,authenticated,service_role;
grant execute on function private.revoke_user_sessions(uuid) to service_role;

create or replace function private.consume_rate_limit(target_bucket text,target_subject_hash text,window_seconds integer,limit_count integer)
returns table(allowed boolean,retry_after_seconds integer,current_count integer)
language plpgsql security definer set search_path='' as $$
declare row private.rate_limit_buckets%rowtype;
begin
  if window_seconds<1 or limit_count<1 or length(target_subject_hash)<>64 then raise exception 'invalid_rate_limit_input'; end if;
  insert into private.rate_limit_buckets(bucket,subject_hash,window_started_at,request_count)
  values(target_bucket,target_subject_hash,now(),1)
  on conflict(bucket,subject_hash) do update set
    window_started_at=case when private.rate_limit_buckets.window_started_at <= now()-make_interval(secs=>window_seconds) then now() else private.rate_limit_buckets.window_started_at end,
    request_count=case when private.rate_limit_buckets.window_started_at <= now()-make_interval(secs=>window_seconds) then 1 else private.rate_limit_buckets.request_count+1 end
  returning * into row;
  current_count:=row.request_count;
  allowed:=row.request_count<=limit_count;
  retry_after_seconds:=case when allowed then 0 else greatest(1,ceil(extract(epoch from (row.window_started_at+make_interval(secs=>window_seconds)-now())))::integer) end;
  return next;
end;
$$;
revoke all on function private.consume_rate_limit(text,text,integer,integer) from public,anon,authenticated,service_role;
grant execute on function private.consume_rate_limit(text,text,integer,integer) to service_role;

create or replace function public.consume_trustos_rate_limit(target_bucket text,target_subject_hash text,window_seconds integer,limit_count integer)
returns table(allowed boolean,retry_after_seconds integer,current_count integer) language sql security invoker set search_path='' as $$
  select * from private.consume_rate_limit(target_bucket,target_subject_hash,window_seconds,limit_count);
$$;
revoke all on function public.consume_trustos_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_trustos_rate_limit(text,text,integer,integer) to service_role;

create or replace function private.run_audit_retention()
returns jsonb language plpgsql security definer set search_path='' as $$
declare failures_deleted integer:=0; invitations_deleted integer:=0; admin_deleted integer:=0;
begin
  perform set_config('trustos.audit_retention','on',true);
  delete from public.audit_events where event_type='sign_in_failed' and occurred_at<now()-interval '90 days';
  get diagnostics failures_deleted=row_count;
  delete from public.invitation_module_roles r using public.invitations i
   where r.invitation_id=i.id and i.status in ('accepted','expired','superseded')
     and coalesce(i.accepted_at,i.superseded_at,i.expires_at)<now()-interval '90 days';
  delete from public.invitations i where i.status in ('accepted','expired','superseded')
     and coalesce(i.accepted_at,i.superseded_at,i.expires_at)<now()-interval '90 days';
  get diagnostics invitations_deleted=row_count;
  delete from public.audit_events e using public.organizations o
   where e.organization_id=o.id and o.status='suspended'
     and o.suspended_at<now()-interval '24 months'
     and coalesce(e.metadata->>'source','')<>'legal_hold';
  get diagnostics admin_deleted=row_count;
  return jsonb_build_object('sign_in_failures',failures_deleted,'invitations',invitations_deleted,'administrative_events',admin_deleted);
end;
$$;
revoke all on function private.run_audit_retention() from public,anon,authenticated,service_role;
grant execute on function private.run_audit_retention() to service_role;

create or replace function public.run_trustos_audit_retention()
returns jsonb language sql security invoker set search_path='' as $$ select private.run_audit_retention(); $$;
revoke all on function public.run_trustos_audit_retention() from public,anon,authenticated;
grant execute on function public.run_trustos_audit_retention() to service_role;

create or replace function private.touch_own_app_session()
returns table(created_at timestamptz,last_activity_at timestamptz)
language sql security definer set search_path='' as $$
  select * from private.touch_app_session(
    nullif((select auth.jwt()->>'session_id'),'')::uuid,
    (select auth.uid())
  );
$$;
revoke all on function private.touch_own_app_session() from public,anon,authenticated,service_role;
grant execute on function private.touch_own_app_session() to authenticated;

create or replace function public.touch_own_trustos_app_session()
returns table(created_at timestamptz,last_activity_at timestamptz)
language sql security invoker set search_path='' as $$
  select * from private.touch_own_app_session();
$$;
revoke all on function public.touch_own_trustos_app_session() from public,anon;
grant execute on function public.touch_own_trustos_app_session() to authenticated;
