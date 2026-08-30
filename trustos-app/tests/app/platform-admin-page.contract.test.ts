import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = process.cwd();
const repoRoot = join(appRoot, '..');
const pageSource = readFileSync(
  join(appRoot, 'app', '(protected)', 'app', 'admin', 'platform', 'page.tsx'),
  'utf8',
);
const actionSource = readFileSync(join(appRoot, 'lib', 'actions', 'platform-admin.ts'), 'utf8');
const migrationPath = join(
  repoRoot,
  'supabase',
  'migrations',
  '20260830133000_prevent_duplicate_organizations.sql',
);
const migrationSource = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';

describe('platform administration safety and compact workflow', () => {
  it('renders one selected administration section instead of every workflow at once', () => {
    expect(pageSource).toContain('Platform administration sections');
    expect(pageSource).toContain("section === 'create'");
    expect(pageSource).toContain("section === 'licensing'");
    expect(pageSource).toContain("section === 'invitations'");
    expect(pageSource).toContain("section === 'suspension'");
  });
  it('keeps the internal BeAccessible platform organisation out of client administration choices', () => {
    expect(actionSource).toContain(".neq('name', 'BeAccessible Platform')");
  });

  it('returns a clear duplicate-organisation result instead of creating another record', () => {
    expect(pageSource).toContain("'organization-exists'");
    expect(actionSource).toContain('organization_exists');
  });

  it('enforces normalized organisation-name uniqueness in the database', () => {
    expect(migrationSource).toContain('organization_exists');
    expect(migrationSource).toContain('lower(btrim(name))');
    expect(migrationSource).toContain('create unique index');
  });
});
