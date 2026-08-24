import type { DenialReason } from '@/lib/authz/types';

const SAFE_MESSAGES: Readonly<Record<DenialReason, string>> = {
  no_session: 'Your session has ended. Sign in again to continue.',
  inactive_organization:
    'This organisation is not currently active in TrustOS. Contact your TrustOS administrator.',
  no_membership: 'Your account does not have active access to this organisation.',
  unlicensed_module: 'This module is not enabled for your organisation.',
  no_module_role: 'You are signed in, but no TrustOS module has been assigned to your account.',
  insufficient_role: 'You do not have permission to open this module. The attempt has been recorded.',
};

export function safeMessageFor(reason: DenialReason): string {
  return SAFE_MESSAGES[reason];
}
