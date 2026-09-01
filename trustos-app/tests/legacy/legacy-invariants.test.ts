import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expected = {
  trustops: '3c525d22cb4be3163248325ace6c974e9dd18593212cb0fedca145497975bde0',
  grantflow: '30b1f770ccc884f2c20de79fd9e857ef21e1abf5d580335f34a156f6e57872a2',
} as const;

function sha(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

test.each(Object.entries(expected))('%s legacy source remains byte-for-byte preserved', (moduleId, digest) => {
  const root = resolve(process.cwd(), '..', `${moduleId}.html`);
  const copy = resolve(process.cwd(), 'legacy', `${moduleId}.html`);
  expect(sha(root)).toBe(digest);
  expect(sha(copy)).toBe(digest);
});