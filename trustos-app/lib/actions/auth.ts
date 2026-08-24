import 'server-only';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { recordAuditEvent } from '@/lib/audit/events';
import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export const RECOVERY_CONFIRMATION =
  'If an account matches that email address, a password-recovery message has been sent.';

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(1024),
});

const recoverySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetSchema = z.object({
  password: z.string().min(12).max(1024),
});

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function safeEmailForRedirect(value: string): string {
  return value.trim().slice(0, 320);
}

export function safeNextPath(value?: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/app';
  }

  try {
    const parsed = new URL(value, 'https://trustos.invalid');
    if (parsed.origin !== 'https://trustos.invalid' || !parsed.pathname.startsWith('/app')) {
      return '/app';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/app';
  }
}

export function safeAuthCallbackPath(value?: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/app';
  }

  try {
    const parsed = new URL(value, 'https://trustos.invalid');
    if (parsed.origin !== 'https://trustos.invalid') {
      return '/app';
    }

    const allowed = new Set(['/accept-invitation', '/reset-password', '/app']);
    return allowed.has(parsed.pathname) && !parsed.search && !parsed.hash
      ? parsed.pathname
      : '/app';
  } catch {
    return '/app';
  }
}

function signInFailureLocation(email: string, next: string): string {
  const query = new URLSearchParams({ error: 'invalid' });
  const preservedEmail = safeEmailForRedirect(email);
  if (preservedEmail) {
    query.set('email', preservedEmail);
  }
  if (next !== '/app') {
    query.set('next', next);
  }
  return `/sign-in?${query.toString()}`;
}

export async function signInAction(formData: FormData) {
  'use server';

  const emailInput = formString(formData, 'email');
  const next = safeNextPath(formString(formData, 'next'));
  const parsed = signInSchema.safeParse({
    email: emailInput,
    password: formString(formData, 'password'),
  });

  if (!parsed.success) {
    redirect(signInFailureLocation(emailInput, next));
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    await recordAuditEvent({
      eventType: 'sign_in_failed',
      outcome: 'denied',
      reasonCode: 'bad_credentials',
      metadata: { source: 'sign_in' },
    });
    redirect(signInFailureLocation(parsed.data.email, next));
  }

  try {
    await recordAuditEvent({
      actorUserId: data.user.id,
      eventType: 'sign_in_succeeded',
      outcome: 'succeeded',
      metadata: { source: 'sign_in' },
    });
  } catch (auditError) {
    await supabase.auth.signOut({ scope: 'local' });
    throw auditError;
  }

  redirect(next);
}

export async function requestRecoveryAction(formData: FormData) {
  'use server';

  const parsed = recoverySchema.safeParse({ email: formString(formData, 'email') });
  const supabase = await createServerClient();

  if (parsed.success) {
    const { TRUSTOS_APP_ORIGIN } = getServerEnv();
    const redirectTo = `${TRUSTOS_APP_ORIGIN}/api/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo,
    });
    await recordAuditEvent({
      eventType: 'password_recovery_requested',
      outcome: error ? 'failed' : 'succeeded',
      reasonCode: error ? 'recovery_request_failed' : null,
      metadata: { source: 'password_recovery' },
    });
  }

  redirect('/forgot-password?sent=1');
}

export async function resetPasswordAction(formData: FormData) {
  'use server';

  const parsed = resetSchema.safeParse({ password: formString(formData, 'password') });
  if (!parsed.success) {
    redirect('/reset-password?error=invalid');
  }

  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/sign-in?error=session');
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (updateError) {
    redirect('/reset-password?error=invalid');
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
  if (signOutError) {
    throw new Error('TrustOS could not complete global sign-out');
  }

  const admin = createAdminClient();
  const { error: revokeError } = await admin.rpc('revoke_trustos_user_sessions', {
    target_user: userData.user.id,
  });
  if (revokeError) {
    throw new Error('TrustOS could not complete session revocation');
  }

  await recordAuditEvent({
    actorUserId: userData.user.id,
    eventType: 'password_changed',
    outcome: 'succeeded',
    metadata: { source: 'password_reset' },
  });

  redirect('/sign-in?changed=1');
}

export async function signOutAction() {
  'use server';

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    await recordAuditEvent({
      actorUserId: data.user.id,
      eventType: 'session_revoked',
      outcome: 'succeeded',
      metadata: { source: 'sign_out' },
    });
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
  if (signOutError) {
    throw new Error('TrustOS could not complete global sign-out');
  }

  if (data.user) {
    const admin = createAdminClient();
    const { error } = await admin.rpc('revoke_trustos_user_sessions', {
      target_user: data.user.id,
    });
    if (error) {
      throw new Error('TrustOS could not complete session revocation');
    }
  }

  redirect('/sign-in');
}
