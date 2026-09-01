import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expected = {
  trustops: '612774a00821e6c9525ff3d9c439e473add148418ff5d54a6c071931555c2886',
  grantflow: '0921a9958e3ac51278910172d92b760856234b6d320623d7c49081e90fd31c4d',
} as const;

function shaCanonicalSource(path: string) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

test.each(Object.entries(expected))('%s legacy source remains content-identical after line-ending normalization', (moduleId, digest) => {
  const root = resolve(process.cwd(), '..', `${moduleId}.html`);
  const copy = resolve(process.cwd(), 'legacy', `${moduleId}.html`);
  expect(shaCanonicalSource(root)).toBe(digest);
  expect(shaCanonicalSource(copy)).toBe(digest);
});
