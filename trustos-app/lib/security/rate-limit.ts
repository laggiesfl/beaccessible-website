import { createHmac } from 'node:crypto';

export function hashRateLimitSubject(email: string, key: string): string {
  const normalized = email.trim().toLowerCase();
  return createHmac('sha256', key).update(normalized).digest('hex');
}

export function signInDelaySeconds(attemptCount: number): number {
  if (attemptCount <= 5) return 0;
  return Math.min(30, 2 ** (attemptCount - 5));
}

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  currentCount: number;
};

export async function consumeRateLimit(input: {
  bucket: string;
  subject: string;
  windowSeconds: number;
  limitCount: number;
}): Promise<RateLimitResult> {
  const [{ createAdminClient }, { getServerEnv }] = await Promise.all([
    import('@/lib/supabase/admin'),
    import('@/lib/env'),
  ]);
  const key = getServerEnv().RATE_LIMIT_HMAC_KEY;
  const subjectHash = hashRateLimitSubject(input.subject, key);
  const { data, error } = await createAdminClient().rpc('consume_trustos_rate_limit', {
    target_bucket: input.bucket,
    target_subject_hash: subjectHash,
    window_seconds: input.windowSeconds,
    limit_count: input.limitCount,
  });
  if (error || !Array.isArray(data) || !data[0]) throw new Error('Rate limit unavailable');
  const row = data[0] as { allowed: boolean; retry_after_seconds: number; current_count: number };
  return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds, currentCount: row.current_count };
}
