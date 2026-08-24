type ErrorSummaryProps = {
  message?: string | null;
};

export function ErrorSummary({ message }: ErrorSummaryProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="error-summary" role="alert" tabIndex={-1} aria-live="assertive">
      <h2>There is a problem</h2>
      <p>{message}</p>
    </div>
  );
}
