do $$
begin
  if not exists (
    select 1
    from private.instance_identity
    where singleton = true
      and product = 'trustos'
      and supabase_project_ref = 'napjcycxzyrsruiifuca'
  ) then
    raise exception 'TrustOS project boundary check failed: dedicated project identity is missing or incorrect.';
  end if;
end
$$;

create index organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status, organization_id);
create index organization_modules_org_status_idx
  on public.organization_modules (organization_id, status, module_id);
create index module_role_assignments_user_org_module_status_idx
  on public.module_role_assignments (user_id, organization_id, module_id, status);
create index invitations_org_status_idx
  on public.invitations (organization_id, status);
create index policy_acceptances_user_org_idx
  on public.policy_acceptances (user_id, organization_id);
create index audit_events_org_occurred_idx
  on public.audit_events (organization_id, occurred_at desc);

create or replace function private.is_active_session(target_session uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_session is not null
    and target_user is not null
    and (select auth.uid()) = target_user
    and exists (
      select 1
      from auth.sessions s
      where s.id = target_session
        and s.user_id = target_user
        and (s.not_after is null or s.not_after > now())
    );
$$;
revoke all on function private.is_active_session(uuid, uuid) from public, anon, authenticated;
grant execute on function private.is_active_session(uuid, uuid) to authenticated;

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
      target_user
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

create or replace function private.has_org_role(target_org uuid, target_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_active_member(target_org, (select auth.uid())))
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.organization_role::text = target_role
    );
$$;
revoke all on function private.has_org_role(uuid, text) from public, anon, authenticated;
grant execute on function private.has_org_role(uuid, text) to authenticated;

create or replace function private.has_module_role(target_org uuid, target_module text, target_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_active_member(target_org, (select auth.uid())))
    and exists (
      select 1
      from public.organization_modules om
      join public.module_role_assignments r
        on r.organization_id = om.organization_id
       and r.module_id = om.module_id
      where om.organization_id = target_org
        and om.module_id = target_module
        and om.status = 'active'
        and r.user_id = (select auth.uid())
        and r.status = 'active'
        and r.role::text = any(target_roles)
    );
$$;
revoke all on function private.has_module_role(uuid, text, text[]) from public, anon, authenticated;
grant execute on function private.has_module_role(uuid, text, text[]) to authenticated;

create or replace function private.revoke_user_sessions(target_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from auth.sessions where user_id = target_user;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
revoke all on function private.revoke_user_sessions(uuid) from public, anon, authenticated, service_role;
grant execute on function private.revoke_user_sessions(uuid) to service_role;
grant usage on schema private to service_role;

create or replace function public.revoke_trustos_user_sessions(target_user uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.revoke_user_sessions(target_user);
$$;
revoke all on function public.revoke_trustos_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_trustos_user_sessions(uuid) to service_role;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.organizations to authenticated;
grant select on public.profiles to authenticated;
grant select on public.module_catalog to authenticated;
grant select on public.organization_memberships to authenticated;
grant select on public.organization_modules to authenticated;
grant select on public.module_role_assignments to authenticated;
grant select on public.invitations to authenticated;
grant select on public.invitation_module_roles to authenticated;
grant select on public.policy_acceptances to authenticated;
grant select on public.audit_events to authenticated;

grant update (display_name, updated_at) on public.profiles to authenticated;
grant insert on public.invitations to authenticated;
grant update (status, superseded_at) on public.invitations to authenticated;
grant insert, delete on public.invitation_module_roles to authenticated;
grant insert on public.module_role_assignments to authenticated;
grant update (status, revoked_at) on public.module_role_assignments to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.module_catalog enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_modules enable row level security;
alter table public.module_role_assignments enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_module_roles enable row level security;
alter table public.policy_acceptances enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_select_active_member
on public.organizations for select
to authenticated
using (
  (select private.is_active_member(id, (select auth.uid())))
);

create policy profiles_select_self_or_client_admin
on public.profiles for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (select private.is_active_session(
      nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
      (select auth.uid())
    ))
  )
  or exists (
    select 1
    from public.organization_memberships target_membership
    where target_membership.user_id = profiles.user_id
      and target_membership.status = 'active'
      and (select private.has_org_role(target_membership.organization_id, 'client_admin'))
  )
);

create policy profiles_update_self
on public.profiles for update
to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_session(
    nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
    (select auth.uid())
  ))
)
with check (
  user_id = (select auth.uid())
  and (select private.is_active_session(
    nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
    (select auth.uid())
  ))
);

create policy module_catalog_select_active_session
on public.module_catalog for select
to authenticated
using (
  (select private.is_active_session(
    nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
    (select auth.uid())
  ))
);

create policy memberships_select_self_or_client_admin
on public.organization_memberships for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (select private.is_active_member(organization_id, (select auth.uid())))
  )
  or (select private.has_org_role(organization_id, 'client_admin'))
);

create policy organization_modules_select_active_member
on public.organization_modules for select
to authenticated
using (
  (select private.is_active_member(organization_id, (select auth.uid())))
);

create policy role_assignments_select_self_or_client_admin
on public.module_role_assignments for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (select private.is_active_member(organization_id, (select auth.uid())))
  )
  or (select private.has_org_role(organization_id, 'client_admin'))
);

create policy role_assignments_client_admin_insert
on public.module_role_assignments for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and status = 'active'
  and (select private.has_org_role(organization_id, 'client_admin'))
  and (select private.is_active_member(organization_id, user_id))
  and exists (
    select 1
    from public.organization_modules om
    where om.organization_id = module_role_assignments.organization_id
      and om.module_id = module_role_assignments.module_id
      and om.status = 'active'
  )
);

create policy role_assignments_client_admin_revoke
on public.module_role_assignments for update
to authenticated
using (
  (select private.has_org_role(organization_id, 'client_admin'))
)
with check (
  status = 'revoked'
  and revoked_at is not null
  and (select private.has_org_role(organization_id, 'client_admin'))
);

create policy invitations_select_client_admin
on public.invitations for select
to authenticated
using (
  (select private.has_org_role(organization_id, 'client_admin'))
);

create policy invitations_client_admin_insert
on public.invitations for insert
to authenticated
with check (
  organization_role = 'team_member'
  and invited_by = (select auth.uid())
  and status = 'pending'
  and (select private.has_org_role(organization_id, 'client_admin'))
);

create policy invitations_client_admin_update
on public.invitations for update
to authenticated
using (
  (select private.has_org_role(organization_id, 'client_admin'))
)
with check (
  status in ('pending', 'superseded', 'expired')
  and (select private.has_org_role(organization_id, 'client_admin'))
);

create policy invitation_roles_select_client_admin
on public.invitation_module_roles for select
to authenticated
using (
  exists (
    select 1
    from public.invitations i
    where i.id = invitation_module_roles.invitation_id
      and (select private.has_org_role(i.organization_id, 'client_admin'))
  )
);

create policy invitation_roles_client_admin_insert
on public.invitation_module_roles for insert
to authenticated
with check (
  exists (
    select 1
    from public.invitations i
    join public.organization_modules om
      on om.organization_id = i.organization_id
     and om.module_id = invitation_module_roles.module_id
    where i.id = invitation_module_roles.invitation_id
      and i.status = 'pending'
      and om.status = 'active'
      and (select private.has_org_role(i.organization_id, 'client_admin'))
  )
);

create policy invitation_roles_client_admin_delete
on public.invitation_module_roles for delete
to authenticated
using (
  exists (
    select 1
    from public.invitations i
    where i.id = invitation_module_roles.invitation_id
      and i.status = 'pending'
      and (select private.has_org_role(i.organization_id, 'client_admin'))
  )
);

create policy policy_acceptances_select_own
on public.policy_acceptances for select
to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_session(
    nullif((select auth.jwt() ->> 'session_id'), '')::uuid,
    (select auth.uid())
  ))
);

create policy audit_events_select_client_admin
on public.audit_events for select
to authenticated
using (
  organization_id is not null
  and (select private.has_org_role(organization_id, 'client_admin'))
);
