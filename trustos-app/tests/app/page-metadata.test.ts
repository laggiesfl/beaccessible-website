import type { Metadata } from 'next';
import { resolveTitle } from 'next/dist/lib/metadata/resolvers/resolve-title';

import { metadata as acceptInvitationMetadata } from '@/app/(auth)/accept-invitation/page';
import { metadata as forgotPasswordMetadata } from '@/app/(auth)/forgot-password/page';
import { metadata as resetPasswordMetadata } from '@/app/(auth)/reset-password/page';
import { metadata as signInMetadata } from '@/app/(auth)/sign-in/page';
import { metadata as appMetadata } from '@/app/(protected)/app/page';
import { metadata as accessibilityMetadata } from '@/app/accessibility/page';
import { metadata as rootMetadata } from '@/app/layout';
import { metadata as privacyMetadata } from '@/app/privacy/page';
import { metadata as termsMetadata } from '@/app/terms/page';

function resolvedDocumentTitle(pageMetadata?: Metadata): string {
  const rootTitle = resolveTitle(rootMetadata.title, null);
  if (!pageMetadata?.title) return rootTitle.absolute;
  return resolveTitle(pageMetadata.title, rootTitle.template).absolute;
}

test('resolves the root default and sign-in document titles', () => {
  expect(resolvedDocumentTitle()).toBe('TrustOS');
  expect(resolvedDocumentTitle(signInMetadata)).toBe('Sign in | TrustOS');
});

test.each([
  ['accept invitation', acceptInvitationMetadata, 'Accept invitation | TrustOS'],
  ['forgot password', forgotPasswordMetadata, 'Forgot password | TrustOS'],
  ['reset password', resetPasswordMetadata, 'Reset password | TrustOS'],
  ['app dashboard', appMetadata, 'Dashboard | TrustOS'],
  ['accessibility', accessibilityMetadata, 'Accessibility | TrustOS'],
  ['privacy', privacyMetadata, 'Privacy notice | TrustOS'],
  ['terms', termsMetadata, 'Account terms | TrustOS'],
])('resolves a descriptive %s document title', (_page, metadata, expectedTitle) => {
  expect(resolvedDocumentTitle(metadata)).toBe(expectedTitle);
});
