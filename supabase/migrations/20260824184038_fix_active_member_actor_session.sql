select private.assert_trustos_instance();

create or replace function private.is_active_member(target_org uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_active_session(
      nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
      (select auth.uid())
    ))
    and exists (
      select 1
      from public.organization_memberships m
      join public.organizations o on o.id = m.organization_id
      where m.organization_id = target_org
        and m.user_id = target_user
        and m.status = 'active'
        and o.status = 'active'
    );
$$;

revoke all on function private.is_active_member(uuid, uuid) from public, anon, authenticated;
grant execute on function private.is_active_member(uuid, uuid) to authenticated;
