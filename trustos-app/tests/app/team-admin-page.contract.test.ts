import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = process.cwd();
const repoRoot = join(appRoot, '..');
const pagePath = join(appRoot, 'app', '(protected)', 'app', 'admin', 'team', 'page.tsx');
const actionPath = join(appRoot, 'lib', 'actions', 'team-admin.ts');
const workspaceSource = readFileSync(
  join(appRoot, 'app', '(protected)', 'app', 'page.tsx'),
  'utf8',
);
const migrationPath = join(
  repoRoot,
  'supabase',
  'migrations',
  '20260830162000_client_team_administration.sql',
);

const pageSource = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : '';
const actionSource = existsSync(actionPath) ? readFileSync(actionPath, 'utf8') : '';
const migrationSource = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';

describe('client team administration', () => {
  it('exposes a compact team administration workflow from the client-admin workspace', () => {
    expect(workspaceSource).toContain('/app/admin/team');
    expect(pageSource).toContain('Team administration sections');
    expect(pageSource).toContain("section === 'members'");
    expect(pageSource).toContain("section === 'invite'");
  });

  it('keeps team invitations inside licensed modules and never creates another client admin', () => {
    expect(actionSource).toContain('trustos_client_create_team_invitation');
    expect(actionSource).toContain("formData.getAll('roles')");
    expect(migrationSource).toContain("'team_member'");
    expect(migrationSource).toContain("organization_role = 'client_admin'");
    expect(migrationSource).toContain("om.status = 'active'");
  });

  it('supports role assignment and revocation for active organisation members only', () => {
    expect(actionSource).toContain('trustos_client_set_module_role');
    expect(migrationSource).toContain('module_role_assignments');
    expect(migrationSource).toContain("target_enabled boolean");
    expect(migrationSource).toContain("m.status = 'active'");
  });

  it('deactivates team members without deleting audit evidence', () => {
    expect(actionSource).toContain('trustos_client_deactivate_team_member');
    expect(migrationSource).toContain("organization_role = 'team_member'");
    expect(migrationSource).toContain("status = 'inactive'");
    expect(migrationSource).toContain("'membership_deactivated'");
    expect(migrationSource).not.toContain('delete from public.audit_events');
  });

  it('records audited client-admin role changes and keeps RPCs server-only', () => {
    expect(migrationSource).toContain("'module_role_assigned'");
    expect(migrationSource).toContain("'module_role_revoked'");
    expect(migrationSource).toContain('revoke all on function');
    expect(migrationSource).toContain('grant execute on function');
    expect(migrationSource).toContain('to service_role');
  });
});
