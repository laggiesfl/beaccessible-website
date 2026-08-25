import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const storedAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  const keyKind = storedAdminKey.startsWith('sb_secret_')
    ? 'secret'
    : storedAdminKey.startsWith('sb_publishable_')
      ? 'publishable'
      : storedAdminKey.startsWith('eyJ')
        ? 'jwt'
        : 'other';

  const admin = createAdminClient();
  const { error: restError } = await admin.from('module_catalog').select('id').limit(1);
  const { error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

  const restOk = !restError;
  const authOk = !authError;

  console.info('trustos_admin_health', {
    restOk,
    authOk,
    restCode: restError?.code ?? null,
    authStatus: authError?.status ?? null,
    keyKind,
    equalsPublishable: storedAdminKey === publishableKey,
  });

  return NextResponse.json(
    { ok: restOk && authOk, restOk, authOk },
    { status: restOk && authOk ? 200 : 503 },
  );
}
