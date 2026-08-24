import {
  RECOVERY_CONFIRMATION,
  safeAuthCallbackPath,
  safeNextPath,
} from '@/lib/actions/auth';

test.each([
  [undefined, '/app'],
  ['', '/app'],
  ['https://example.com/app', '/app'],
  ['//example.com/app', '/app'],
  ['/sign-in', '/app'],
  ['/app', '/app'],
  ['/app/modules/trustops', '/app/modules/trustops'],
] as const)('normalizes sign-in destination %s to %s', (value, expected) => {
  expect(safeNextPath(value)).toBe(expected);
});

test.each([
  [undefined, '/app'],
  ['', '/app'],
  ['https://example.com/reset-password', '/app'],
  ['//example.com/reset-password', '/app'],
  ['/sign-in', '/app'],
  ['/accept-invitation', '/accept-invitation'],
  ['/reset-password', '/reset-password'],
  ['/app', '/app'],
  ['/app/modules/trustops', '/app'],
] as const)('normalizes auth callback destination %s to %s', (value, expected) => {
  expect(safeAuthCallbackPath(value)).toBe(expected);
});

test('recovery confirmation does not disclose whether an account exists', () => {
  expect(RECOVERY_CONFIRMATION).toBe(
    'If an account matches that email address, a password-recovery message has been sent.',
  );
});
