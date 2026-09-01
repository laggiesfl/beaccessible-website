export const SESSION_WARNING_MS = 50 * 60 * 1000;
export const SESSION_IDLE_LIMIT_MS = 60 * 60 * 1000;
export const SESSION_ABSOLUTE_LIMIT_MS = 12 * 60 * 60 * 1000;
export const FRESH_AUTH_LIMIT_MS = 15 * 60 * 1000;

export type SessionState =
  | { status: 'active'; remainingMs: number }
  | { status: 'warning'; remainingMs: number }
  | { status: 'expired'; remainingMs: 0; reason: 'idle' | 'absolute' };

export function getSessionState(input: {
  createdAt: string;
  lastActivityAt: string;
  now?: Date;
}): SessionState {
  const nowMs = (input.now ?? new Date()).getTime();
  const createdMs = new Date(input.createdAt).getTime();
  const activityMs = new Date(input.lastActivityAt).getTime();
  const idleElapsed = nowMs - activityMs;
  const absoluteElapsed = nowMs - createdMs;

  if (absoluteElapsed >= SESSION_ABSOLUTE_LIMIT_MS) {
    return { status: 'expired', remainingMs: 0, reason: 'absolute' };
  }
  if (idleElapsed >= SESSION_IDLE_LIMIT_MS) {
    return { status: 'expired', remainingMs: 0, reason: 'idle' };
  }

  const remainingMs = Math.min(
    SESSION_IDLE_LIMIT_MS - idleElapsed,
    SESSION_ABSOLUTE_LIMIT_MS - absoluteElapsed,
  );
  return idleElapsed >= SESSION_WARNING_MS
    ? { status: 'warning', remainingMs }
    : { status: 'active', remainingMs };
}
