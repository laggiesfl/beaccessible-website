'use client';

import { useEffect, useRef } from 'react';

type RoleActionFeedbackProps = {
  message: string;
};

export function RoleActionFeedback({ message }: RoleActionFeedbackProps) {
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedbackRef.current?.focus();
  }, []);

  return (
    <div
      ref={feedbackRef}
      id="role-action-feedback"
      className="status-message role-action-feedback"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
    >
      <strong>Role updated successfully.</strong>
      <br />
      {message}
    </div>
  );
}
