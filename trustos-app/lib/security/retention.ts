import { timingSafeEqual } from 'node:crypto';

export function authorizeCronRequest(authorization: string | null, secret: string): boolean {
  if (!authorization?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
