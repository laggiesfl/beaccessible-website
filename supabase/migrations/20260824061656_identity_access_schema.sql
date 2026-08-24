create extension if not exists citext with schema extensions;

do $$
declare
  unexpected_tables text;
begin
  select string_agg(format('%I.%I', schemaname, tablename), ', ' order by tablename)
    into unexpected_tables
  from pg_catalog.pg_tables
  where schemaname = 'public';

  if unexpected_tables is not null then
    raise exception
      'TrustOS project boundary check failed: the target database already contains public application tables: %. Refusing to install TrustOS into a non-empty/shared Supabase project.',
      unexpected_tables;
  end if;
end
$$;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create schema private;
revoke all on schema private from public, anon, authenticated;

create table private.instance_identity (
  singleton boolean primary key default true check (singleton),
  product text not null check (product = 'trustos'),
  supabase_project_ref text not null check (supabase_project_ref = 'napjcycxzyrsruiifuca'),
  created_at timestamptz not null default now()
);

insert into private.instance_identity (singleton, product, supabase_project_ref)
values (true, 'trustos', 'napjcycxzyrsruiifuca');

revoke all on table private.instance_identity from public, anon, authenticated;

create type public.organization_status as enum ('active', 'suspended');
create type public.organization_role as enum ('client_admin', 'team_member');
create type public.membership_status as enum ('active', 'inactive');
create type public.module_status as enum ('active', 'inactive');
create type public.module_role as enum (
  'module_admin',
  'contributor',
  'reviewer',
  'approver',
  'viewer'
);
create type public.role_assignment_status as enum ('active', 'revoked');
create type public.invitation_status as enum (
  'pending',
  'accepted',
  'superseded',
  'expired'
);
create type public.policy_type as enum ('privacy_notice', 'account_terms');
create type public.audit_outcome as enum ('succeeded', 'denied', 'failed');
create type private.platform_admin_status as enum ('pending', 'active', 'revoked');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  suspended_at timestamptz,
  constraint organizations_status_timestamps_check check (
    (status = 'active' and suspended_at is null)
    or (status = 'suspended' and suspended_at is not null and suspended_at >= created_at)
  )
);

create table public.profiles (
  user_id uuid primary key references auth.users (id),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_updated_after_created_check check (updated_at >= created_at)
);

create table public.module_catalog (
  id text primary key check (id in ('trustops', 'grantflow')),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  status public.module_status not null default 'active'
);

insert into public.module_catalog (id, name, status) values
  ('trustops', 'TrustOps Core', 'active'),
  ('grantflow', 'GrantFlow', 'active')
on conflict do nothing;

create table private.platform_admins (
  user_id uuid primary key references auth.users (id),
  status private.platform_admin_status not null default 'pending',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint platform_admins_status_timestamps_check check (
    (status in ('pending', 'active') and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and revoked_at >= created_at)
  )
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null references auth.users (id),
  organization_role public.organization_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  deactivated_at timestamptz,
  constraint organization_memberships_organization_user_key unique (organization_id, user_id),
  constraint organization_memberships_status_timestamps_check check (
    (status = 'active' and deactivated_at is null)
    or (status = 'inactive' and deactivated_at is not null and deactivated_at >= created_at)
  )
);

create table public.organization_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  module_id text not null references public.module_catalog (id),
  status public.module_status not null default 'active',
  enabled_at timestamptz not null default now(),
  disabled_at timestamptz,
  constraint organization_modules_organization_module_key unique (organization_id, module_id),
  constraint organization_modules_status_timestamps_check check (
    (status = 'active' and disabled_at is null)
    or (status = 'inactive' and disabled_at is not null and disabled_at >= enabled_at)
  )
);

create table public.module_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  module_id text not null,
  role public.module_role not null,
  status public.role_assignment_status not null default 'active',
  assigned_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint module_role_assignments_membership_fkey
    foreign key (organization_id, user_id)
    references public.organization_memberships (organization_id, user_id),
  constraint module_role_assignments_organization_module_fkey
    foreign key (organization_id, module_id)
    references public.organization_modules (organization_id, module_id),
  constraint module_role_assignments_organization_user_module_role_key
    unique (organization_id, user_id, module_id, role),
  constraint module_role_assignments_status_timestamps_check check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and revoked_at >= created_at)
  )
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  email_normalized extensions.citext not null
    check (email_normalized::text = lower(btrim(email_normalized::text))),
  organization_role public.organization_role not null,
  invited_by uuid not null references auth.users (id),
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  superseded_at timestamptz,
  constraint invitations_expiry_check check (expires_at > created_at),
  constraint invitations_status_timestamps_check check (
    (status in ('pending', 'expired') and accepted_at is null and superseded_at is null)
    or (
      status = 'accepted'
      and accepted_at is not null
      and accepted_at >= created_at
      and accepted_at <= expires_at
      and superseded_at is null
    )
    or (
      status = 'superseded'
      and superseded_at is not null
      and superseded_at >= created_at
      and accepted_at is null
    )
  )
);

create table public.invitation_module_roles (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id),
  module_id text not null references public.module_catalog (id),
  role public.module_role not null,
  constraint invitation_module_roles_invitation_module_role_key
    unique (invitation_id, module_id, role)
);

create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  organization_id uuid not null references public.organizations (id),
  policy_type public.policy_type not null,
  policy_version text not null check (char_length(btrim(policy_version)) between 1 and 100),
  accepted_at timestamptz not null default now(),
  constraint policy_acceptances_user_org_policy_version_key
    unique (user_id, organization_id, policy_type, policy_version)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id),
  actor_user_id uuid references auth.users (id),
  event_type text not null check (char_length(btrim(event_type)) between 1 and 100),
  target_type text check (target_type is null or char_length(btrim(target_type)) between 1 and 100),
  target_id uuid,
  module_id text references public.module_catalog (id),
  outcome public.audit_outcome not null,
  reason_code text check (reason_code is null or char_length(btrim(reason_code)) between 1 and 100),
  request_id uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint audit_events_metadata_size_check check (octet_length(metadata::text) <= 8192)
);
