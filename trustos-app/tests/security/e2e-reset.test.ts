import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routePath = join(process.cwd(), 'app', 'api', 'test', 'e2e-reset', 'route.ts');

test('E2E reset endpoint is secret-gated and limited to fixed fictional records', () => {
  const source = readFileSync(routePath, 'utf8');
  expect(source).toContain('E2E_FIXTURE_SECRET');
  expect(source).toContain("authorizeCronRequest(request.headers.get('authorization'), secret)");
  expect(source).toContain('e2e-invitee@example.invalid');
  expect(source).toContain('30000000-0000-4000-8000-000000000001');
  expect(source).toContain('20000000-0000-4000-8000-000000000003');
  expect(source).toContain('10000000-0000-4000-8000-000000000003');
  expect(source).toContain('20000000-0000-4000-8000-000000000002');
  expect(source).not.toContain('fadila@');
});

test('E2E reset endpoint is unavailable when its dedicated secret is absent', () => {
  const source = readFileSync(routePath, 'utf8');
  expect(source).toContain("if (!secret) return new Response('Not found', { status: 404 });");
});

test('E2E reset scenarios are allowlisted and fail closed', () => {
  const source = readFileSync(routePath, 'utf8');
  expect(source).toContain("'invitation_expired'");
  expect(source).toContain("'client_b_unlicensed'");
  expect(source).toContain("'client_b_suspended'");
  expect(source).toContain("'client_b_membership_removed'");
  expect(source).toContain("if (!SCENARIOS.has(scenario)) return new Response('Unknown fixture scenario', { status: 400 });");
});
