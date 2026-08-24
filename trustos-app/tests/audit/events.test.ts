const rpcMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { recordAuditEvent } from '@/lib/audit/events';
import { safeMessageFor } from '@/lib/errors';

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: '90000000-0000-0000-0000-000000000001', error: null });
});

test('rejects secret-bearing metadata keys before any database call', async () => {
  await expect(
    recordAuditEvent({
      eventType: 'sign_in_failed',
      outcome: 'denied',
      reasonCode: 'bad_credentials',
      metadata: { password: 'must-not-log' } as never,
    }),
  ).rejects.toThrow('Audit metadata key is not allowed');

  expect(rpcMock).not.toHaveBeenCalled();
});

test('rejects metadata keys outside the explicit allowlist', async () => {
  await expect(
    recordAuditEvent({
      eventType: 'access_denied',
      outcome: 'denied',
      metadata: { arbitrary_detail: 'no' } as never,
    }),
  ).rejects.toThrow('Audit metadata key is not allowed');
});

test('rejects metadata larger than the database audit limit', async () => {
  await expect(
    recordAuditEvent({
      eventType: 'administrative_action',
      outcome: 'succeeded',
      metadata: { user_agent_family: 'x'.repeat(9000) },
    }),
  ).rejects.toThrow('Audit metadata exceeds 8 KiB');
});

test('uses the narrow server append function and generates a request id', async () => {
  await recordAuditEvent({
    organizationId: 'aaaaaaaa-0000-0000-0000-000000000001',
    actorUserId: '10000000-0000-0000-0000-000000000001',
    eventType: 'module_role_assigned',
    targetType: 'module_role_assignment',
    targetId: '70000000-0000-0000-0000-000000000001',
    moduleId: 'trustops',
    outcome: 'succeeded',
    metadata: { source: 'team_admin', changed_fields: ['role'] },
  });

  expect(rpcMock).toHaveBeenCalledTimes(1);
  expect(rpcMock).toHaveBeenCalledWith(
    'append_trustos_audit_event',
    expect.objectContaining({
      p_organization_id: 'aaaaaaaa-0000-0000-0000-000000000001',
      p_actor_user_id: '10000000-0000-0000-0000-000000000001',
      p_event_type: 'module_role_assigned',
      p_module_id: 'trustops',
      p_outcome: 'succeeded',
      p_metadata: { source: 'team_admin', changed_fields: ['role'] },
      p_request_id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    }),
  );
});

test('fails closed with a generic message when required audit storage fails', async () => {
  rpcMock.mockResolvedValue({ data: null, error: { message: 'database detail that must not leak' } });

  await expect(
    recordAuditEvent({
      eventType: 'access_denied',
      outcome: 'denied',
      reasonCode: 'insufficient_role',
    }),
  ).rejects.toThrow('Required audit event could not be stored');
});

test('maps authorization denials to approved plain-language copy', () => {
  expect(safeMessageFor('no_module_role')).toBe(
    'You are signed in, but no TrustOS module has been assigned to your account.',
  );
  expect(safeMessageFor('insufficient_role')).toBe(
    'You do not have permission to open this module. The attempt has been recorded.',
  );
});
