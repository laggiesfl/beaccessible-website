import { render, screen } from '@testing-library/react';

import { ModuleShell } from '@/components/module-shell';
import { GET } from '@/app/(protected)/app/modules/[moduleId]/route';

vi.mock('@/lib/modules/access', () => ({
  resolveModuleRequestAccess: vi.fn(async () => ({
    allowed: false,
    reason: 'unlicensed_module',
    actorUserId: 'user-1',
    organizationId: 'org-1',
  })),
}));

vi.mock('@/lib/audit/events', () => ({ recordAuditEvent: vi.fn(async () => 'event-1') }));

test('direct module route denies an unlicensed or roleless user', async () => {
  const response = await GET(new Request('https://example.test/app/modules/grantflow'), {
    params: Promise.resolve({ moduleId: 'grantflow' }),
  });
  expect(response.status).toBe(403);
  expect(await response.text()).not.toContain('GrantFlow AI');
});

test('licensed frames remain mounted while another module is selected', () => {
  render(<ModuleShell modules={[{ id: 'trustops', name: 'TrustOps' }, { id: 'grantflow', name: 'GrantFlow' }]} initialModule="trustops" />);
  expect(screen.getAllByTitle(/module/i)).toHaveLength(2);
});