export type AuditViewEvent = {
  id: string;
  eventType: string;
  actorName: string;
  organizationName: string;
  outcome: 'succeeded' | 'denied' | 'failed';
  reasonCode: string | null;
  occurredAt: string;
};

const OUTCOME_LABELS: Record<AuditViewEvent['outcome'], string> = {
  succeeded: 'Succeeded',
  denied: 'Denied',
  failed: 'Failed',
};

function eventLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export function AuditTable({ events }: { events: readonly AuditViewEvent[] }) {
  if (events.length === 0) {
    return <p className="status-message">No access security events are available for this scope.</p>;
  }

  return (
    <div className="table-scroll" tabIndex={0} aria-label="Access security event table">
      <table aria-label="Access security events">
        <caption>Read-only TrustOS security and access events</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Organisation</th>
            <th scope="col">Event</th>
            <th scope="col">Actor</th>
            <th scope="col">Outcome</th>
            <th scope="col">Reason</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString('en-ZA')}</time></td>
              <td>{event.organizationName}</td>
              <td>{eventLabel(event.eventType)}</td>
              <td>{event.actorName}</td>
              <td>{OUTCOME_LABELS[event.outcome]}</td>
              <td>{event.reasonCode ? eventLabel(event.reasonCode) : 'Not applicable'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
