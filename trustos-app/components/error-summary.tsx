'use client';

import { useEffect, useRef } from 'react';

type ErrorSummaryProps = {
  message?: string | null;
};

export function ErrorSummary({ message }: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) summaryRef.current?.focus();
  }, [message]);

  if (!message) return null;

  return (
    <div ref={summaryRef} className="error-summary" role="alert" tabIndex={-1} aria-live="assertive">
      <h2>There is a problem</h2>
      <p>{message}</p>
    </div>
  );
}
