import { createBrowserClient } from '@/lib/supabase/browser';

const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTE1MTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6NDA3MDkwODgwMH0.signature';

beforeEach(() => {
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://napjcycxzyrsruiifuca.supabase.co',
  );
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'public-key-1234567890',
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        access_token: accessToken,
        expires_in: 3600,
        refresh_token: 'browser-refresh-token',
        token_type: 'bearer',
        user: {
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2026-08-20T00:00:00.000Z',
          id: '11151111-1111-4111-8111-111111111111',
          role: 'authenticated',
          updated_at: '2026-08-20T00:00:00.000Z',
          user_metadata: {},
        },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('browser authentication is unavailable and cannot retain access tokens', async () => {
  const client = createBrowserClient();
  let boundaryError: string | null = null;
  let retainedToken: string | null = null;
  let signInToken: string | null = null;

  try {
    const unsafeAuth = (
      client as unknown as {
        auth: {
          getSession: () => Promise<{
            data: { session: { access_token: string } | null };
          }>;
          signInWithPassword: (credentials: {
            email: string;
            password: string;
          }) => Promise<{
            data: { session: { access_token: string } | null };
          }>;
        };
      }
    ).auth;
    const signIn = await unsafeAuth.signInWithPassword({
      email: 'fictional@example.com',
      password: 'Correct-Horse-Accessible-2026',
    });
    const retained = await unsafeAuth.getSession();

    signInToken = signIn.data.session?.access_token ?? null;
    retainedToken = retained.data.session?.access_token ?? null;
  } catch (error) {
    boundaryError = error instanceof Error ? error.message : String(error);
  }

  expect({ boundaryError, retainedToken, signInToken }).toEqual({
    boundaryError:
      'Browser authentication is unavailable; use a server action instead.',
    retainedToken: null,
    signInToken: null,
  });
  expect('auth' in client).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});
