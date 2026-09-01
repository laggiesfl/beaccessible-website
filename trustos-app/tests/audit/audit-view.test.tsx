import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AuditTable } from '@/components/audit-table';

const pageSource = readFileSync(
  join(process.cwd(), 'app', '(protected)', 'app', 'audit', 'page.tsx'),
  'utf8',
);

test('renders accessible, read-only audit evidence with textual outcome', () => {
  render(
    <AuditTable events={[{
      id: 'event-1',
      eventType: 'module_role_changed',
      actorName: 'Fictional Administrator',
      organizationName: 'Fictional Client A',
      outcome: 'succeeded',
      reasonCode: null,
      occurredAt: '2026-09-01T12:00:00.000Z',
    }]} />,
  );
  expect(screen.getByRole('table', { name: 'Access security events' })).toBeInTheDocument();
  expect(screen.getByText('Succeeded')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /edit|delete/i })).not.toBeInTheDocument();
});

test('client audit access stays in the user RLS context and platform scope uses the authoritative admin path', () => {
  expect(pageSource).toContain('const result = await supabase');
  expect(pageSource).toContain('const result = await admin');
  expect(pageSource).toContain(".from('audit_events')");
  expect(pageSource).toContain("organization_role === 'client_admin'");
  expect(pageSource).not.toContain('.delete(');
  expect(pageSource).not.toContain('.update(');
});

test('paginates audit evidence in pages of 50', () => {
  expect(pageSource).toContain('AUDIT_PAGE_SIZE = 50');
  expect(pageSource).toContain('.range(from, to)');
});

test('makes the audit view discoverable from administrator workspaces', () => {
  const workspaceSource = readFileSync(
    join(process.cwd(), 'app', '(protected)', 'app', 'page.tsx'),
    'utf8',
  );
  expect(workspaceSource).toContain('href="/app/audit"');
  expect(workspaceSource).toContain('Open access security audit');
});
