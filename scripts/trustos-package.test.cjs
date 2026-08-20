const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let buildPackage;
try {
  ({ buildPackage } = require('./build-trustos-vercel-package.cjs'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const root = path.resolve(__dirname, '..');

test('the dedicated package maps TrustOS files to Vercel release names', () => {
  assert.equal(typeof buildPackage, 'function');
  const tempRoot = path.join(root, '.test-tmp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const outputDir = fs.mkdtempSync(path.join(tempRoot, 'trustos-package-'));

  try {
    const writtenFiles = buildPackage(outputDir);
    assert.ok(writtenFiles.includes('index.html'));
    assert.ok(writtenFiles.includes('trustos.html'));
    assert.ok(writtenFiles.includes('vercel.json'));
    assert.equal(
      fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8'),
      fs.readFileSync(path.join(root, 'trustos.html'), 'utf8')
    );
    assert.equal(
      fs.readFileSync(path.join(outputDir, 'vercel.json'), 'utf8'),
      fs.readFileSync(path.join(root, 'trustos-vercel.json'), 'utf8')
    );
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
