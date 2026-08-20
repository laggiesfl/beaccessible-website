const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const packageMap = Object.freeze({
  'index.html': 'trustos.html',
  'trustos.html': 'trustos.html',
  'trustops.html': 'trustops.html',
  'grantflow.html': 'grantflow.html',
  'trustos-privacy.html': 'trustos-privacy.html',
  'trustos-accessibility.html': 'trustos-accessibility.html',
  'trustos-core.js': 'trustos-core.js',
  'trustos-config.js': 'trustos-config.js',
  'trustos-shell.js': 'trustos-shell.js',
  'vercel.json': 'trustos-vercel.json'
});

function buildPackage(outputDirectory) {
  if (!outputDirectory) {
    throw new TypeError('An output directory is required.');
  }

  const resolvedOutput = path.resolve(outputDirectory);
  const isRepositoryRoot = resolvedOutput === repositoryRoot;
  const isInsideRepository = resolvedOutput.startsWith(`${repositoryRoot}${path.sep}`);

  if (isRepositoryRoot || !isInsideRepository) {
    throw new RangeError('The package output must be a dedicated directory inside the repository.');
  }

  fs.mkdirSync(resolvedOutput, { recursive: true });

  for (const [destinationName, sourceName] of Object.entries(packageMap)) {
    fs.copyFileSync(
      path.join(repositoryRoot, sourceName),
      path.join(resolvedOutput, destinationName)
    );
  }

  return Object.keys(packageMap);
}

if (require.main === module) {
  const outputDirectory = process.argv[2] || path.join(repositoryRoot, '.trustos-vercel-dist');
  const packagedFiles = buildPackage(outputDirectory);
  process.stdout.write(`Built TrustOS Vercel package with ${packagedFiles.length} files in ${path.resolve(outputDirectory)}.\n`);
}

module.exports = { buildPackage, packageMap };
