select private.assert_trustos_instance();

create or replace function public.reset_trustos_rate_limit_state(
  target_buckets text[],
  target_subject_hashes text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer := 0;
begin
  perform private.assert_trustos_instance();
  if target_buckets is null or cardinality(target_buckets) = 0
     or exists (select 1 from unnest(target_buckets) bucket where bucket not in ('sign_in','password_recovery')) then
    raise exception 'rate_limit_bucket_invalid';
  end if;
  if target_subject_hashes is null or cardinality(target_subject_hashes) = 0
     or cardinality(target_subject_hashes) > 20 then
    raise exception 'rate_limit_subjects_invalid';
  end if;

  delete from private.rate_limit_state state
  where state.bucket = any(target_buckets)
    and state.subject_hash = any(target_subject_hashes);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.reset_trustos_rate_limit_state(text[],text[])
  from public, anon, authenticated, service_role;
grant execute on function public.reset_trustos_rate_limit_state(text[],text[])
  to service_role;
