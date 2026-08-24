import { z } from 'zod';

export const TRUSTOS_SUPABASE_PROJECT_REF = 'napjcycxzyrsruiifuca';
const TRUSTOS_SUPABASE_HOST = `${TRUSTOS_SUPABASE_PROJECT_REF}.supabase.co`;
const LOCAL_SUPABASE_HOSTS = new Set(['127.0.0.1', 'localhost']);

const basePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

type PublicConfiguration = z.infer<typeof basePublicSchema>;

function enforceTrustOSProjectBoundary(
  value: PublicConfiguration,
  context: z.RefinementCtx,
) {
  const url = new URL(value.NEXT_PUBLIC_SUPABASE_URL);
  const isLocal = LOCAL_SUPABASE_HOSTS.has(url.hostname);
  const isHostedTrustOS =
    url.protocol === 'https:' && url.hostname === TRUSTOS_SUPABASE_HOST;
  const isProductionLike =
    value.NODE_ENV === 'production' ||
    value.VERCEL_ENV === 'production' ||
    value.VERCEL_ENV === 'preview';

  if (isProductionLike && !isHostedTrustOS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['NEXT_PUBLIC_SUPABASE_URL'],
      message: `TrustOS must use the dedicated TrustOS Supabase project (${TRUSTOS_SUPABASE_PROJECT_REF}).`,
    });
    return;
  }

  if (!isProductionLike && !isHostedTrustOS && !isLocal) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['NEXT_PUBLIC_SUPABASE_URL'],
      message: `TrustOS must use the dedicated TrustOS Supabase project (${TRUSTOS_SUPABASE_PROJECT_REF}) or a local Supabase instance during development.`,
    });
  }
}

const publicSchema = basePublicSchema.superRefine(enforceTrustOSProjectBoundary);

const appOriginSchema = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TRUSTOS_APP_ORIGIN must be an HTTPS origin with no path, query or fragment.',
    });
  }
});

const serverSchema = basePublicSchema
  .extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    CRON_SECRET: z.string().min(32),
    RATE_LIMIT_HMAC_KEY: z.string().min(32),
    TRUSTOS_APP_ORIGIN: appOriginSchema,
  })
  .superRefine(enforceTrustOSProjectBoundary);

type Environment = Record<string, string | undefined>;

const browserEnvironment = (): Environment => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export function getPublicEnv(environment: Environment = browserEnvironment()) {
  const parsed = publicSchema.parse(environment);
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } = parsed;

  return {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getServerEnv(environment: Environment = process.env) {
  const parsed = serverSchema.parse(environment);
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET,
    RATE_LIMIT_HMAC_KEY,
    TRUSTOS_APP_ORIGIN,
  } = parsed;

  return {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET,
    RATE_LIMIT_HMAC_KEY,
    TRUSTOS_APP_ORIGIN,
  };
}
