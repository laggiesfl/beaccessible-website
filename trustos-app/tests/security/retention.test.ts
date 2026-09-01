import { authorizeCronRequest } from '@/lib/security/retention';

test('rejects a retention request without the exact bearer secret', () => {
  expect(authorizeCronRequest(null, 's'.repeat(32))).toBe(false);
  expect(authorizeCronRequest('Bearer wrong', 's'.repeat(32))).toBe(false);
});

test('accepts only the exact retention bearer secret', () => {
  const secret = 's'.repeat(32);
  expect(authorizeCronRequest(`Bearer ${secret}`, secret)).toBe(true);
});
