select private.assert_trustos_instance();

grant usage on schema private to authenticated;
grant execute on function private.touch_own_trustos_app_session() to authenticated;

create or replace function public.touch_own_trustos_app_session()
returns table(created_at timestamptz,last_activity_at timestamptz)
language sql
security invoker
set search_path=''
as $$
  select * from private.touch_own_trustos_app_session();
$$;

revoke all on function public.touch_own_trustos_app_session() from public,anon;
grant execute on function public.touch_own_trustos_app_session() to authenticated;
