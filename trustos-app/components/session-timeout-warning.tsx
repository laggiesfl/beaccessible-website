'use client';

import { useEffect, useState } from 'react';

import { getSessionState } from '@/lib/security/session';

export function SessionTimeoutWarning({
  createdAt,
  lastActivityAt,
  now,
  onContinue,
}: {
  createdAt: string;
  lastActivityAt: string;
  now?: Date;
  onContinue?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(() => now ?? new Date());

  useEffect(() => {
    if (now) return;
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [now]);

  const state = getSessionState({ createdAt, lastActivityAt, now: now ?? clock });

  async function signOut() {
    await fetch('/api/session/sign-out', { method: 'POST' });
    window.location.assign('/sign-in?reason=session-ended');
  }

  useEffect(() => {
    if (state.status === 'expired') void signOut();
  }, [state.status]);

  if (state.status !== 'warning') return null;

  const minutes = Math.max(1, Math.ceil(state.remainingMs / 60_000));

  async function continueSession() {
    setBusy(true);
    try {
      if (onContinue) await onContinue();
      else await fetch('/api/session/continue', { method: 'POST' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="session-warning" role="alertdialog" aria-labelledby="session-warning-title" aria-describedby="session-warning-description">
      <h2 id="session-warning-title">Your session will end in {minutes} minutes</h2>
      <p id="session-warning-description">
        For your security, TrustOS signs you out after 60 minutes without activity.
      </p>
      <div className="session-warning-actions">
        <button type="button" className="primary-button" onClick={continueSession} disabled={busy}>
          {busy ? 'Continuing…' : 'Continue my session'}
        </button>
        <button type="button" className="secondary-button" onClick={() => void signOut()}>
          Sign out now
        </button>
      </div>
    </div>
  );
}
