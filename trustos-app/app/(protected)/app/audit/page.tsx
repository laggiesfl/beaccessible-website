import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuditTable, type AuditViewEvent } from '@/components/audit-table';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export const AUDIT_PAGE_SIZE = 50;

type AuditPageProps = {
  searchParams: Promise<{ page?: string }>;
};

type AuditRow = {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  outcome: 'succeeded' | 'denied' | 'failed';
  reason_code: string | null;
  occurred_at: string;
};

function pageNumber(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const currentPage = pageNumber(params.page);
  const from = (currentPage - 1) * AUDIT_PAGE_SIZE;
  const to = from + AUDIT_PAGE_SIZE - 1;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?error=session');

  const isPlatformClaim = user.app_metadata?.platform_role === 'platform_admin';
  const admin = createAdminClient();
  let isPlatformAdmin = false;

  if (isPlatformClaim) {
    const { data, error } = await admin.rpc('verify_platform_admin', { target_user: user.id });
    isPlatformAdmin = !error && data === true;
  }

  const memberships = await supabase
    .from('organization_memberships')
    .select('organization_id,organization_role,status')
    .eq('user_id', user.id)
    .eq('status', 'active');
  const clientAdminMembership = memberships.data?.find(
    (membership) => membership.organization_role === 'client_admin',
  );

  if (!isPlatformAdmin && !clientAdminMembership) {
    redirect('/app?error=audit-access-denied');
  }

  let rows: AuditRow[] = [];
  let total = 0;

  if (isPlatformAdmin) {
    const result = await admin
      .from('audit_events')
      .select('id,organization_id,actor_user_id,event_type,outcome,reason_code,occurred_at', { count: 'exact' })
      .order('occurred_at', { ascending: false })
      .range(from, to);
    if (result.error) throw new Error('TrustOS audit events could not be loaded');
    rows = (result.data ?? []) as AuditRow[];
    total = result.count ?? 0;
  } else {
    const result = await supabase
      .from('audit_events')
      .select('id,organization_id,actor_user_id,event_type,outcome,reason_code,occurred_at', { count: 'exact' })
      .eq('organization_id', clientAdminMembership!.organization_id)
      .order('occurred_at', { ascending: false })
      .range(from, to);
    if (result.error) throw new Error('TrustOS audit events could not be loaded');
    rows = (result.data ?? []) as AuditRow[];
    total = result.count ?? 0;
  }

  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
  const organizationIds = [...new Set(rows.map((row) => row.organization_id).filter((id): id is string => Boolean(id)))];
  const lookupClient = isPlatformAdmin ? admin : supabase;
  const profiles = actorIds.length
    ? await lookupClient.from('profiles').select('user_id,display_name').in('user_id', actorIds)
    : { data: [], error: null };
  const organizations = organizationIds.length
    ? await lookupClient.from('organizations').select('id,name').in('id', organizationIds)
    : { data: [], error: null };

  if (profiles.error || organizations.error) {
    throw new Error('TrustOS audit labels could not be loaded');
  }

  const actorNames = new Map((profiles.data ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const organizationNames = new Map((organizations.data ?? []).map((organization) => [organization.id, organization.name]));

  const events: AuditViewEvent[] = rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    actorName: row.actor_user_id ? actorNames.get(row.actor_user_id) ?? 'Account unavailable' : 'System',
    organizationName: row.organization_id
      ? organizationNames.get(row.organization_id) ?? 'Organisation unavailable'
      : 'Platform-wide',
    outcome: row.outcome,
    reasonCode: row.reason_code,
    occurredAt: row.occurred_at,
  }));
  const hasPrevious = currentPage > 1;
  const hasNext = to + 1 < total;

  return (
    <main className="page-content" id="main-content">
      <header className="admin-page-header">
        <p className="eyebrow">BeAccessible TrustOS</p>
        <h1>Access security audit</h1>
        <p>
          Review read-only security and access evidence. Confidential metadata is not displayed.
        </p>
      </header>

      <AuditTable events={events} />

      <nav aria-label="Audit event pages" className="audit-pagination">
        {hasPrevious ? <Link href={`/app/audit?page=${currentPage - 1}`}>Previous 50 events</Link> : <span>First page</span>}
        <span>Page {currentPage}</span>
        {hasNext ? <Link href={`/app/audit?page=${currentPage + 1}`}>Next 50 events</Link> : <span>Last page</span>}
      </nav>
    </main>
  );
}
