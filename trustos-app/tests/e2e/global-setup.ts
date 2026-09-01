import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadFixtureSecret() {
  if (process.env.E2E_FIXTURE_SECRET) return process.env.E2E_FIXTURE_SECRET;

  const envPath = resolve(process.cwd(), '.env.e2e.local');
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith('E2E_FIXTURE_SECRET='));

  if (!line) throw new Error('E2E_FIXTURE_SECRET is required for staged E2E fixture reset.');
  return line.slice('E2E_FIXTURE_SECRET='.length).trim();
}

export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? 'https://trustos-phase-2-preview.vercel.app';
  const secret = loadFixtureSecret();
  const response = await fetch(`${baseURL}/api/test/e2e-reset`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    throw new Error(`E2E fixture reset failed with HTTP ${response.status}.`);
  }
}
