import { NextRequest } from 'next/server';

import { GET } from '@/app/api/auth/callback/route';

const authState = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: {
      exchangeCodeForSession: authState.exchangeCodeForSession,
      verifyOtp: authState.verifyOtp,
    },
  }),
}));

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://napjcycxzyrsruiifuca.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-key-12345678901234567890');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key-12345678901234567890');
  vi.stubEnv('CRON_SECRET', 'cron-secret-123456789012345678901234567890');
  vi.stubEnv('RATE_LIMIT_HMAC_KEY', 'rate-limit-key-123456789012345678901234567890');
  vi.stubEnv('TRUSTOS_APP_ORIGIN', 'https://trustos-phase-2-preview.vercel.app');

  authState.exchangeCodeForSession.mockReset();
  authState.verifyOtp.mockReset();
  authState.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('accepts an invite token hash and preserves the invitation destination', async () => {
  const invitation = 'e5680636-a813-41a6-b980-a513d3ac82fd';
  const request = new NextRequest(
    `https://trustos-phase-2-preview.vercel.app/api/auth/callback?next=%2Faccept-invitation&invitation=${invitation}&token_hash=invite-token-hash&type=invite`,
  );

  const response = await GET(request);

  expect(authState.verifyOtp).toHaveBeenCalledWith({
    token_hash: 'invite-token-hash',
    type: 'invite',
  });
  expect(authState.exchangeCodeForSession).not.toHaveBeenCalled();
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe(
    `https://trustos-phase-2-preview.vercel.app/accept-invitation?invitation=${invitation}`,
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
});
