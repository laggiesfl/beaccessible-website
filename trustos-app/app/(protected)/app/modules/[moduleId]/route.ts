import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { recordAuditEvent } from '@/lib/audit/events';
import { resolveModuleRequestAccess, type TrustOSModuleId } from '@/lib/modules/access';

const LEGACY_FILES: Record<TrustOSModuleId, string> = {
  trustops: 'trustops.html',
  grantflow: 'grantflow.html',
};

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'text/html; charset=utf-8',
};

function isModuleId(value: string): value is TrustOSModuleId {
  return value === 'trustops' || value === 'grantflow';
}

function deniedPage() {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Access denied</title></head><body><main><h1>Access denied</h1><p>You do not have permission to open this module.</p></main></body></html>';
}

export async function GET(_request: Request, context: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await context.params;
  if (!isModuleId(moduleId)) {
    return new Response('Not found', { status: 404, headers: PRIVATE_HEADERS });
  }

  const access = await resolveModuleRequestAccess(moduleId);
  if (!access.allowed) {
    await recordAuditEvent({
      organizationId: access.organizationId,
      actorUserId: access.actorUserId,
      eventType: 'access_denied',
      targetType: 'module',
      targetId: moduleId,
      moduleId,
      outcome: 'denied',
      reasonCode: access.reason ?? 'access_denied',
      metadata: { source: 'direct_module_route' },
    });
    return new Response(deniedPage(), { status: 403, headers: PRIVATE_HEADERS });
  }

  const html = await readFile(join(process.cwd(), 'legacy', LEGACY_FILES[moduleId]), 'utf8');
  await recordAuditEvent({
    organizationId: access.organizationId,
    actorUserId: access.actorUserId,
    eventType: 'protected_module_entered',
    targetType: 'module',
    targetId: moduleId,
    moduleId,
    outcome: 'succeeded',
    metadata: { source: 'module_shell' },
  });

  return new Response(html, { status: 200, headers: PRIVATE_HEADERS });
}
