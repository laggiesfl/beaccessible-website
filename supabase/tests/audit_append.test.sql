begin;

select plan(9);

select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'INSERT'),
  'authenticated users cannot insert audit events directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'UPDATE'),
  'authenticated users cannot update audit events directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'DELETE'),
  'authenticated users cannot delete audit events directly'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.append_trustos_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)',
    'EXECUTE'
  ),
  'authenticated users cannot execute the server audit append function'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.append_trustos_audit_event(uuid,uuid,text,text,uuid,text,text,text,uuid,jsonb)',
    'EXECUTE'
  ),
  'service role can execute the narrow audit append wrapper'
);

set local role service_role;
select lives_ok(
  $$select public.append_trustos_audit_event(
      null,
      null,
      'sign_in_failed',
      null,
      null,
      null,
      'denied',
      'bad_credentials',
      '90000000-0000-4000-8000-000000000001'::uuid,
      '{"source":"sign_in"}'::jsonb
    )$$,
  'valid server audit append succeeds'
);

reset role;
select results_eq(
  $$select count(*) from public.audit_events where request_id = '90000000-0000-4000-8000-000000000001'::uuid$$,
  $$values (1::bigint)$$,
  'valid audit append creates exactly one event'
);

set local role service_role;
select throws_ok(
  $$select public.append_trustos_audit_event(
      null,
      null,
      'sign_in_failed',
      null,
      null,
      null,
      'denied',
      'bad_credentials',
      '90000000-0000-4000-8000-000000000002'::uuid,
      '{"password":"must-not-log"}'::jsonb
    )$$,
  'P0001',
  'Audit metadata key is not allowed',
  'secret-bearing metadata is rejected'
);

reset role;
select throws_ok(
  $$update public.audit_events
    set reason_code = 'tampered'
    where request_id = '90000000-0000-4000-8000-000000000001'::uuid$$,
  'P0001',
  'Audit events are immutable',
  'audit rows cannot be altered after creation'
);

select * from finish();
rollback;
