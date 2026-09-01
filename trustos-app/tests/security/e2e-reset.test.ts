import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routePath = join(process.cwd(), 'app', 'api', 'test', 'e2e-reset', 'route.ts');

test('E2E reset endpoint is secret-gated and limited to fictional fixed records', () => {
  const source = readFileSync(routePath, 'utf8');
  expect(source).toContain('E2E_FIXTURE_SECRET');
  expect(source).toContain("authorizeCronRequest(request.headers.get('authorization'), secret)");
  expect(source).toContain("e2e-invitee@example.invalid");
  expect(source).toContain("30000000-0000-4000-8000-000000000001");
  expect(source).toContain("20000000-0000-4000-8000-000000000003");
  expect(source).not.toContain('fadila@');
});

test('E2E reset endpoint is unavailable when its dedicated secret is absent', () => {
  const source = readFileSync(routePath, 'utf8');
  expect(source).toContain("if (!secret) return new Response('Not found', { status: 404 });");
});
