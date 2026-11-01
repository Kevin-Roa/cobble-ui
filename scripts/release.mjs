// Publishes cobble-ui to npm (via changesets, which also tags) and then to GitHub Packages.
// GitHub Packages requires a scoped name, so the package is published there as @<owner>/cobble-ui.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const dir = 'packages/cobble-ui';
const manifestPath = `${dir}/package.json`;
const original = readFileSync(manifestPath, 'utf8');
const { name, version } = JSON.parse(original);
const owner = (process.env.GITHUB_REPOSITORY_OWNER ?? 'Kevin-Roa').toLowerCase();
const ghName = `@${owner}/${name}`;
const ghRegistry = 'https://npm.pkg.github.com';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

run('pnpm', ['--filter', 'cobble-ui', 'build']);
run('pnpm', ['changeset', 'publish']);

let published = false;
try {
  const out = execFileSync(
    'npm',
    ['view', `${ghName}@${version}`, 'version', '--registry', ghRegistry],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );
  published = out.trim() === version;
} catch {}

if (published) {
  console.warn(`${ghName}@${version} is already on GitHub Packages`);
} else {
  const manifest = { ...JSON.parse(original), name: ghName };
  manifest.publishConfig = { ...manifest.publishConfig, registry: ghRegistry };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  try {
    run('pnpm', ['publish', '--no-git-checks', '--registry', ghRegistry], { cwd: dir });
  } finally {
    writeFileSync(manifestPath, original);
  }
}
