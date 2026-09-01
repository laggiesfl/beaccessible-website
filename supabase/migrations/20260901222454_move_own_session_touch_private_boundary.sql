select private.assert_trustos_instance();

create or replace function private.touch_own_trustos_app_session()
returns table(created_at timestamptz,last_activity_at timestamptz)
language sql
security definer
set search_path=''
as $$
  select * from private.touch_app_session(
    nullif((select auth.jwt()->>'session_id'),'')::uuid,
    (select auth.uid())
  );
$$;

revoke all on function private.touch_own_trustos_app_session() from public,anon,authenticated;
grant execute on function private.touch_own_trustos_app_session() to service_role;

revoke all on function public.touch_own_trustos_app_session() from public,anon,authenticated;
drop function if exists public.touch_own_trustos_app_session();
