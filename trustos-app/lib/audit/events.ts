import 'server-only';

import { randomUUID } from 'node:crypto';

import { createAdminClient } from '@/lib/supabase/admin';

export type AuditEventType =
  | 'invitation_sent'
  | 'invitation_resent'
  | 'invitation_superseded'
  | 'invitation_accepted'
  | 'invitation_expired'
  | 'sign_in_succeeded'
  | 'sign_in_failed'
  | 'password_recovery_requested'
  | 'password_changed'
  | 'session_revoked'
  | 'organization_created'
  | 'organization_activated'
  | 'organization_suspended'
  | 'organization_restored'
  | 'module_enabled'
  | 'module_disabled'
  | 'membership_added'
  | 'membership_changed'
  | 'membership_deactivated'
  | 'membership_restored'
  | 'organization_role_assigned'
  | 'organization_role_changed'
  | 'organization_role_revoked'
  | 'module_role_assigned'
  | 'module_role_changed'
  | 'module_role_revoked'
  | 'protected_module_entered'
  | 'access_denied'
  | 'administrative_action'
  | 'retention_completed';

export type AuditOutcome = 'succeeded' | 'denied' | 'failed';

export interface AuditMetadata {
  source?: string;
  changed_fields?: readonly string[];
  retention_count?: number;
  user_agent_family?: string;
}

export interface AuditEventInput {
  organizationId?: string | null;
  actorUserId?: string | null;
  eventType: AuditEventType;
  targetType?: string | null;
  targetId?: string | null;
  moduleId?: 'trustops' | 'grantflow' | null;
  outcome: AuditOutcome;
  reasonCode?: string | null;
  requestId?: string;
  metadata?: AuditMetadata;
}

const EVENT_TYPES = new Set<AuditEventType>([
  'invitation_sent',
  'invitation_resent',
  'invitation_superseded',
  'invitation_accepted',
  'invitation_expired',
  'sign_in_succeeded',
  'sign_in_failed',
  'password_recovery_requested',
  'password_changed',
  'session_revoked',
  'organization_created',
  'organization_activated',
  'organization_suspended',
  'organization_restored',
  'module_enabled',
  'module_disabled',
  'membership_added',
  'membership_changed',
  'membership_deactivated',
  'membership_restored',
  'organization_role_assigned',
  'organization_role_changed',
  'organization_role_revoked',
  'module_role_assigned',
  'module_role_changed',
  'module_role_revoked',
  'protected_module_entered',
  'access_denied',
  'administrative_action',
  'retention_completed',
]);

const ALLOWED_METADATA_KEYS = new Set([
  'source',
  'changed_fields',
  'retention_count',
  'user_agent_family',
]);

const BLOCKED_METADATA_FRAGMENTS = [
  'password',
  'token',
  'secret',
  'email_body',
  'form_data',
];

function validateMetadata(metadata: AuditMetadata): void {
  for (const key of Object.keys(metadata)) {
    const normalizedKey = key.toLowerCase();
    if (
      !ALLOWED_METADATA_KEYS.has(key) ||
      BLOCKED_METADATA_FRAGMENTS.some((fragment) => normalizedKey.includes(fragment))
    ) {
      throw new Error('Audit metadata key is not allowed');
    }
  }

  const serialized = JSON.stringify(metadata);
  if (Buffer.byteLength(serialized, 'utf8') > 8192) {
    throw new Error('Audit metadata exceeds 8 KiB');
  }
}

export async function recordAuditEvent(input: AuditEventInput): Promise<string> {
  if (!EVENT_TYPES.has(input.eventType)) {
    throw new Error('Audit event type is not allowed');
  }

  const metadata = input.metadata ?? {};
  validateMetadata(metadata);

  const client = createAdminClient();
  const { data, error } = await client.rpc('append_trustos_audit_event', {
    p_organization_id: input.organizationId ?? null,
    p_actor_user_id: input.actorUserId ?? null,
    p_event_type: input.eventType,
    p_target_type: input.targetType ?? null,
    p_target_id: input.targetId ?? null,
    p_module_id: input.moduleId ?? null,
    p_outcome: input.outcome,
    p_reason_code: input.reasonCode ?? null,
    p_request_id: input.requestId ?? randomUUID(),
    p_metadata: metadata,
  });

  if (error || typeof data !== 'string') {
    throw new Error('Required audit event could not be stored');
  }

  return data;
}
