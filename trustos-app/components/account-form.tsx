import type { ReactNode } from 'react';

type AccountFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  children: ReactNode;
};

export function AccountForm({ action, submitLabel, children }: AccountFormProps) {
  return (
    <form className="account-form" action={action} noValidate>
      {children}
      <button className="primary-button" type="submit">{submitLabel}</button>
    </form>
  );
}
