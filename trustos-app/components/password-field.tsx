'use client';

import { useState } from 'react';

type PasswordFieldProps = {
  id: string;
  label: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  helpId?: string;
  helpText?: string;
};

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  helpId,
  helpText,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {helpText && helpId ? <p id={helpId} className="field-help">{helpText}</p> : null}
      <div className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-describedby={helpId}
          required
        />
        <button
          className="secondary-button"
          type="button"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide password' : 'Show password'}
        </button>
      </div>
    </div>
  );
}
