select private.assert_trustos_instance();

insert into private.app_sessions (session_id, user_id, created_at, last_activity_at)
select
  s.id,
  s.user_id,
  s.created_at,
  coalesce(s.refreshed_at, s.updated_at, s.created_at)
from auth.sessions s
where (s.not_after is null or s.not_after > now())
  and s.created_at > now() - interval '12 hours'
on conflict (session_id) do nothing;
