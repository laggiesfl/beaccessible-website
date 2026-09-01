import { redirect } from 'next/navigation';

import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { createServerClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect('/sign-in?error=session');
  }

  const { data: sessionRows, error: sessionError } = await supabase.rpc('touch_own_trustos_app_session');
  if (sessionError || !Array.isArray(sessionRows) || sessionRows.length !== 1) {
    redirect('/sign-in?error=session-expired');
  }

  const session = sessionRows[0] as { created_at: string; last_activity_at: string };

  return (
    <>
      <SessionTimeoutWarning
        createdAt={session.created_at}
        lastActivityAt={session.last_activity_at}
      />
      {children}
    </>
  );
}
