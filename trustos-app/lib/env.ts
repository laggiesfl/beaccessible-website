import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  CRON_SECRET: z.string().min(32),
  RATE_LIMIT_HMAC_KEY: z.string().min(32),
});

type Environment = Record<string, string | undefined>;

const browserEnvironment = (): Environment => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export function getPublicEnv(environment: Environment = browserEnvironment()) {
  return publicSchema.parse(environment);
}

export function getServerEnv(environment: Environment = process.env) {
  return serverSchema.parse(environment);
}
