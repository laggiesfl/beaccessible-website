import Link from 'next/link';

import {
  deactivateTeamMemberAction,
  getTeamAdminView,
  inviteTeamMemberAction,
  setTeamMemberRoleAction,
  teamRoleLabel,
} from '@/lib/actions/team-admin';
import type { ModuleRole } from '@/lib/authz/types';
import { RoleActionFeedback } from './role-action-feedback';

type TeamAdminPageProps = {
  searchParams: Promise<{ result?: string; section?: string; member?: string; module?: string; role?: string }>;
};

type TeamSection = 'members' | 'invite';

const TEAM_SECTIONS: ReadonlyArray<{ id: TeamSection; label: string }> = [
  { id: 'members', label: 'Members and roles' },
  { id: 'invite', label: 'Invite team member' },
];

const MODULE_ROLES: readonly ModuleRole[] = [
  'module_admin',
  'contributor',
  'reviewer',
  'approver',
  'viewer',
];

const RESULT_MESSAGES: Record<string, string> = {
  'invitation-sent': 'Team member invitation sent successfully.',
  'invitation-pending': 'An unused invitation is already pending for that email address.',
  'member-already-active': 'That person is already an active member of this organisation.',
  'invitation-invalid': 'Enter a valid email address and choose at least one module role.',
  'invitation-failed': 'The team invitation could not be created.',
  'invitation-delivery-failed': 'The invitation email could not be delivered. The unused invitation was cancelled.',
  'unlicensed-role': 'That role belongs to a module that is not licensed to this organisation.',
  'role-updated': 'Module role updated successfully.',
  'role-invalid': 'The requested role change is invalid.',
  'role-failed': 'The module role could not be changed.',
  'member-not-active': 'That person is not an active member of this organisation.',
  'member-deactivated': 'Team member access was deactivated. Audit evidence was preserved.',
  'deactivation-not-confirmed': 'Confirm deactivation before submitting the request.',
  'deactivation-self-denied': 'A client administrator cannot deactivate their own account here.',
  'deactivation-failed': 'The team member could not be deactivated.',
};

function getTeamSection(value: string | undefined): TeamSection {
  return TEAM_SECTIONS.some((item) => item.id === value) ? (value as TeamSection) : 'members';
}

function sectionHref(section: TeamSection): string {
  return `/app/admin/team?section=${section}`;
}

function memberHref(userId: string): string {
  return `/app/admin/team?section=members&member=${encodeURIComponent(userId)}`;
}

function hasRole(
  roles: readonly { moduleId: 'trustops' | 'grantflow'; role: ModuleRole }[],
  moduleId: string,
  role: ModuleRole,
): boolean {
  return roles.some((assignment) => assignment.moduleId === moduleId && assignment.role === role);
}

export default async function TeamAdminPage({ searchParams }: TeamAdminPageProps) {
  const params = await searchParams;
  const section = getTeamSection(params.section);
  const view = await getTeamAdminView();
  const selectedMember =
    view.members.find((member) => member.userId === params.member) ??
    view.members.find((member) => member.userId === view.currentUserId) ??
    view.members[0];
  const isRoleResult = params.result === 'role-assigned' || params.result === 'role-revoked';
  const message = params.result && !isRoleResult ? RESULT_MESSAGES[params.result] : null;
  const moduleLabel = params.module === 'trustops' ? 'TrustOps' : params.module === 'grantflow' ? 'GrantFlow' : null;
  const resultRole = MODULE_ROLES.includes(params.role as ModuleRole) ? (params.role as ModuleRole) : null;
  const roleFeedback =
    isRoleResult && selectedMember && params.member === selectedMember.userId && moduleLabel && resultRole
      ? `${moduleLabel} ${teamRoleLabel(resultRole)} ${params.result === 'role-assigned' ? 'assigned to' : 'revoked from'} ${selectedMember.displayName}.`
      : null;

  return (
    <main className="page-content" id="main-content">
      <header className="admin-page-header">
        <p className="eyebrow">{view.organization.name}</p>
        <h1>Team administration</h1>
        <p>
          Invite team members and manage module roles only inside this organisation. Module roles do
          not cross between TrustOps and GrantFlow.
        </p>
        <p><Link href="/app">Back to workspace</Link></p>
      </header>

      <nav aria-label="Team administration sections" className="admin-section-nav">
        {TEAM_SECTIONS.map((item) => (
          <Link
            href={sectionHref(item.id)}
            key={item.id}
            aria-current={section === item.id ? 'page' : undefined}
            className="admin-section-link"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {message ? (
        <div className="status-message" role="status" aria-live="polite">
          {message}
        </div>
      ) : null}

      {section === 'members' ? (
        <section aria-labelledby="members-heading" className="admin-section">
          <h2 id="members-heading">Current team</h2>
          <p>Select one person to review or change their module roles.</p>
          {view.members.length === 0 ? (
            <p>No active team members are available.</p>
          ) : (
            <div className="table-scroll" tabIndex={0} aria-label="Current team members">
              <table>
                <caption>Active TrustOS members for {view.organization.name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Account role</th>
                    <th scope="col">Module roles</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {view.members.map((member) => (
                    <tr key={member.userId}>
                      <th scope="row">
                        {member.displayName}
                        <br />
                        <span className="muted-text">{member.email}</span>
                      </th>
                      <td>{member.organizationRole === 'client_admin' ? 'Client administrator' : 'Team member'}</td>
                      <td>
                        {member.roles.length === 0
                          ? 'No module roles'
                          : member.roles
                              .map((assignment) => `${assignment.moduleId === 'trustops' ? 'TrustOps' : 'GrantFlow'}: ${teamRoleLabel(assignment.role)}`)
                              .join(', ')}
                      </td>
                      <td>
                        <Link href={memberHref(member.userId)}>
                          {selectedMember?.userId === member.userId ? 'Selected' : 'Manage roles'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedMember ? (
            <div className="account-card admin-card-wide team-member-card">
              <h3>Manage roles for {selectedMember.displayName}</h3>
              <p>{selectedMember.email}</p>
              {roleFeedback ? <RoleActionFeedback message={roleFeedback} /> : null}
              {view.licensedModules.length === 0 ? (
                <p>No modules are currently licensed to this organisation.</p>
              ) : (
                view.licensedModules.map((module) => (
                  <fieldset key={module.id}>
                    <legend>{module.name} roles</legend>
                    {MODULE_ROLES.map((role) => {
                      const enabled = hasRole(selectedMember.roles, module.id, role);
                      return (
                        <form action={setTeamMemberRoleAction} key={role} className="inline-admin-form">
                          <input type="hidden" name="targetUser" value={selectedMember.userId} />
                          <input type="hidden" name="moduleId" value={module.id} />
                          <input type="hidden" name="role" value={role} />
                          <input type="hidden" name="enabled" value={enabled ? 'false' : 'true'} />
                          <span>{teamRoleLabel(role)}: {enabled ? 'Assigned' : 'Not assigned'}</span>
                          <button type="submit" className="secondary-button">
                            {enabled ? `Revoke ${teamRoleLabel(role)}` : `Assign ${teamRoleLabel(role)}`}
                          </button>
                        </form>
                      );
                    })}
                  </fieldset>
                ))
              )}

              {selectedMember.organizationRole === 'team_member' ? (
                <form action={deactivateTeamMemberAction} className="account-form destructive-form">
                  <input type="hidden" name="targetUser" value={selectedMember.userId} />
                  <label>
                    <input type="checkbox" name="confirmDeactivation" required />{' '}
                    I confirm that I want to deactivate this team member. Audit evidence will be preserved.
                  </label>
                  <button type="submit" className="secondary-button">Deactivate team member</button>
                </form>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {section === 'invite' ? (
        <section aria-labelledby="invite-team-heading" className="account-card admin-section admin-card-wide">
          <h2 id="invite-team-heading">Invite team member</h2>
          <p>
            Invitations create team-member accounts only. Choose at least one role, and only from
            modules licensed to {view.organization.name}.
          </p>
          {view.licensedModules.length === 0 ? (
            <p>No licensed modules are available, so team invitations are currently disabled.</p>
          ) : (
            <form action={inviteTeamMemberAction} className="account-form">
              <div className="form-field">
                <label htmlFor="team-member-email">Team member email address</label>
                <input
                  id="team-member-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                />
              </div>

              {view.licensedModules.map((module) => (
                <fieldset key={module.id}>
                  <legend>{module.name} roles</legend>
                  <p>Choose only the responsibilities this person needs.</p>
                  {MODULE_ROLES.map((role) => (
                    <label key={role} className="role-checkbox-label">
                      <input type="checkbox" name="roles" value={`${module.id}:${role}`} />{' '}
                      {teamRoleLabel(role)}
                    </label>
                  ))}
                </fieldset>
              ))}

              <button type="submit" className="primary-button">Send team member invitation</button>
            </form>
          )}
        </section>
      ) : null}
    </main>
  );
}
