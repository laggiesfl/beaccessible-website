import { act, fireEvent, render, screen } from '@testing-library/react';

import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { getSessionState } from '@/lib/security/session';

test('does not warn before 50 minutes of inactivity', () => {
  const state = getSessionState({
    createdAt: '2026-09-01T09:00:00Z',
    lastActivityAt: '2026-09-01T09:00:00Z',
    now: new Date('2026-09-01T09:49:59Z'),
  });
  expect(state.status).toBe('active');
});

test('warns at 50 minutes and permits a keyboard extension', async () => {
  const continueSession = vi.fn(async () => undefined);
  render(
    <SessionTimeoutWarning
      createdAt="2026-09-01T09:00:00Z"
      lastActivityAt="2026-09-01T09:00:00Z"
      now={new Date('2026-09-01T09:50:00Z')}
      onContinue={continueSession}
    />,
  );

  expect(screen.getByRole('alertdialog')).toHaveTextContent('Your session will end in 10 minutes');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue my session' }));
  });
  expect(continueSession).toHaveBeenCalledTimes(1);
});

test('expires at 60 idle minutes and never extends beyond 12 hours', () => {
  const idleExpired = getSessionState({
    createdAt: '2026-09-01T09:00:00Z',
    lastActivityAt: '2026-09-01T09:00:00Z',
    now: new Date('2026-09-01T10:00:00Z'),
  });
  const absoluteExpired = getSessionState({
    createdAt: '2026-09-01T09:00:00Z',
    lastActivityAt: '2026-09-01T20:59:59Z',
    now: new Date('2026-09-01T21:00:00Z'),
  });
  expect(idleExpired).toMatchObject({ status: 'expired', reason: 'idle' });
  expect(absoluteExpired).toMatchObject({ status: 'expired', reason: 'absolute' });
});
