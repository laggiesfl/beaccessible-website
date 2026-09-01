import { NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/audit/events';
import { getServerEnv } from '@/lib/env';
import { authorizeCronRequest } from '@/lib/security/retention';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { CRON_SECRET } = getServerEnv();
  if (!authorizeCronRequest(request.headers.get('authorization'), CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('run_trustos_audit_retention');
  if (error || !data || typeof data !== 'object') {
    return NextResponse.json({ error: 'retention_failed' }, { status: 500 });
  }

  const counts = data as Record<string, number>;
  const total = Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
  await recordAuditEvent({
    eventType: 'retention_completed',
    outcome: 'succeeded',
    metadata: { source: 'audit_retention', retention_count: total },
  });

  return NextResponse.json({ completed: true, deleted: total });
}
