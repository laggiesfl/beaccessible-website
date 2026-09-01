import { render, screen } from '@testing-library/react';

import { ModuleShell } from '@/components/module-shell';
import { GET } from '@/app/(protected)/app/modules/[moduleId]/route';
import { recordAuditEvent } from '@/lib/audit/events';

vi.mock('@/lib/modules/access', () => ({
  resolveModuleRequestAccess: vi.fn(async () => ({
    allowed: false,
    reason: 'unlicensed_module',
    actorUserId: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
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

test('module audit uses module_id rather than putting a text module identifier in UUID target_id', async () => {
  await GET(new Request('https://example.test/app/modules/grantflow'), {
    params: Promise.resolve({ moduleId: 'grantflow' }),
  });
  expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ moduleId: 'grantflow', targetId: null }));
});


test('licensed frames remain mounted while another module is selected', () => {
  render(
    <ModuleShell
      modules={[{ id: 'trustops', name: 'TrustOps' }, { id: 'grantflow', name: 'GrantFlow' }]}
      initialModule="trustops"
    />,
  );
  expect(screen.getAllByTitle(/module/i)).toHaveLength(2);
});
