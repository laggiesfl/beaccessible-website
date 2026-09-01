begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('private','app_sessions','app sessions are server authoritative');
select has_table('private','rate_limit_buckets','rate limit buckets are private');
select has_function('private','consume_rate_limit',array['text','text','integer','integer'],'private rate limiting exists');
select has_function('public','consume_trustos_rate_limit',array['text','text','integer','integer'],'service wrapper exists');
select has_function('private','run_audit_retention',array[]::text[],'private retention exists');
select has_function('public','run_trustos_audit_retention',array[]::text[],'service retention wrapper exists');
select has_function('public','register_trustos_app_session',array['uuid','uuid'],'session registration wrapper exists');
select has_function('public','touch_trustos_app_session',array['uuid','uuid'],'service session touch wrapper exists');
select has_function('public','touch_own_trustos_app_session',array[]::text[],'own-session touch wrapper exists');

select ok(has_function_privilege('service_role','public.consume_trustos_rate_limit(text,text,integer,integer)','EXECUTE'),'service role can consume limits');
select ok(not has_function_privilege('authenticated','public.consume_trustos_rate_limit(text,text,integer,integer)','EXECUTE'),'authenticated clients cannot consume limits directly');
select ok(has_function_privilege('service_role','public.run_trustos_audit_retention()','EXECUTE'),'service role can run retention');
select ok(has_function_privilege('authenticated','public.touch_own_trustos_app_session()','EXECUTE'),'authenticated users can touch only their own session');
select ok(not has_table_privilege('authenticated','private.app_sessions','SELECT'),'authenticated clients cannot read private app sessions');

select * from finish();
rollback;
