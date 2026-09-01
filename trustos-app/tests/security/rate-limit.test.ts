import { hashRateLimitSubject, signInDelaySeconds } from '@/lib/security/rate-limit';

test('hashes normalized email without retaining the address', () => {
  const digestA = hashRateLimitSubject(' Person@Example.com ', 'k'.repeat(32));
  const digestB = hashRateLimitSubject('person@example.com', 'k'.repeat(32));
  expect(digestA).toBe(digestB);
  expect(digestA).toMatch(/^[a-f0-9]{64}$/);
  expect(digestA).not.toContain('person@example.com');
});

test.each([
  [1, 0],
  [5, 0],
  [6, 2],
  [7, 4],
  [10, 30],
])('sign-in attempt %i has a bounded progressive delay of %i seconds', (attempt, delay) => {
  expect(signInDelaySeconds(attempt)).toBe(delay);
});
