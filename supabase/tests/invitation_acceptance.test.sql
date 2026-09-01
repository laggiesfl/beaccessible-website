begin;

select plan(15);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.accept_trustos_invitation(uuid,uuid,text,text,text)',
    'EXECUTE'
  ),
  'authenticated users cannot call the privileged invitation acceptance wrapper'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.accept_trustos_invitation(uuid,uuid,text,text,text)',
    'EXECUTE'
  ),
  'service role can call the narrow invitation acceptance wrapper'
);

insert into auth.users (id,email,is_anonymous) values
('51111111-1111-4111-8111-111111111111','inviter@example.test',false),
('52222222-2222-4222-8222-222222222222','pilot@example.test',false),
('53333333-3333-4333-8333-333333333333','other@example.test',false);

insert into public.organizations (id,name) values
('5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional Invitation Org');
insert into public.organization_modules (organization_id,module_id) values
('5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','trustops');

insert into public.invitations (
  id,organization_id,email_normalized,organization_role,invited_by,status,created_at,expires_at,accepted_at,superseded_at
) values
('54444444-4444-4444-8444-444444444441','5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot@example.test','team_member','51111111-1111-4111-8111-111111111111','pending',now(),now()+interval '72 hours',null,null),
('54444444-4444-4444-8444-444444444442','5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot@example.test','team_member','51111111-1111-4111-8111-111111111111','pending',now()-interval '72 hours',now()-interval '1 hour',null,null),
('54444444-4444-4444-8444-444444444443','5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot@example.test','team_member','51111111-1111-4111-8111-111111111111','superseded',now(),now()+interval '72 hours',null,now()),
('54444444-4444-4444-8444-444444444444','5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot@example.test','team_member','51111111-1111-4111-8111-111111111111','accepted',now()-interval '1 hour',now()+interval '72 hours',now(),null),
('54444444-4444-4444-8444-444444444445','5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pilot@example.test','team_member','51111111-1111-4111-8111-111111111111','pending',now(),now()+interval '72 hours',null,null);

insert into public.invitation_module_roles (invitation_id,module_id,role) values
('54444444-4444-4444-8444-444444444441','trustops','viewer'),
('54444444-4444-4444-8444-444444444445','grantflow','viewer');

select lives_ok(
  $$select private.accept_invitation(
    '52222222-2222-4222-8222-222222222222'::uuid,
    '54444444-4444-4444-8444-444444444441'::uuid,
    'Fictional Pilot User','privacy-2026-08','terms-2026-08')$$,
  'valid invitation activates atomically'
);

select is(
  (select count(*) from public.organization_memberships where user_id='52222222-2222-4222-8222-222222222222'),
  1::bigint,
  'valid acceptance creates one membership'
);
select is(
  (select count(*) from public.module_role_assignments where user_id='52222222-2222-4222-8222-222222222222'),
  1::bigint,
  'valid acceptance creates the licensed module role'
);
select is(
  (select count(*) from public.policy_acceptances where user_id='52222222-2222-4222-8222-222222222222'),
  2::bigint,
  'valid acceptance stores both policy acknowledgements'
);
select is(
  (select status::text from public.invitations where id='54444444-4444-4444-8444-444444444441'),
  'accepted',
  'valid invitation is marked accepted'
);
select is(
  (select count(*) from public.audit_events where target_id='54444444-4444-4444-8444-444444444441' and event_type='invitation_accepted'),
  1::bigint,
  'valid acceptance appends one immutable audit event'
);

select throws_ok(
  $$select private.accept_invitation('53333333-3333-4333-8333-333333333333'::uuid,'54444444-4444-4444-8444-444444444445'::uuid,'Wrong Email','privacy-2026-08','terms-2026-08')$$,
  'P0001','invitation_wrong_email','wrong-email acceptance is denied'
);
select throws_ok(
  $$select private.accept_invitation('52222222-2222-4222-8222-222222222222'::uuid,'54444444-4444-4444-8444-444444444442'::uuid,'Expired','privacy-2026-08','terms-2026-08')$$,
  'P0001','invitation_expired','expired invitation is denied'
);
select throws_ok(
  $$select private.accept_invitation('52222222-2222-4222-8222-222222222222'::uuid,'54444444-4444-4444-8444-444444444443'::uuid,'Superseded','privacy-2026-08','terms-2026-08')$$,
  'P0001','invitation_superseded','superseded invitation is denied'
);
select throws_ok(
  $$select private.accept_invitation('52222222-2222-4222-8222-222222222222'::uuid,'54444444-4444-4444-8444-444444444444'::uuid,'Reused','privacy-2026-08','terms-2026-08')$$,
  'P0001','invitation_already_used','reused invitation is denied'
);
select throws_ok(
  $$select private.accept_invitation('52222222-2222-4222-8222-222222222222'::uuid,'54444444-4444-4444-8444-444444444445'::uuid,'Unlicensed','privacy-2026-08','terms-2026-08')$$,
  'P0001','invitation_unlicensed_module','unlicensed module assignment is denied'
);
select is(
  (select count(*) from public.organization_memberships where user_id='53333333-3333-4333-8333-333333333333'),
  0::bigint,
  'failed acceptance leaves no partial membership'
);
select is(
  (select count(*) from public.module_role_assignments where user_id='53333333-3333-4333-8333-333333333333'),
  0::bigint,
  'failed acceptance leaves no partial role assignment'
);

select * from finish();
rollback;
