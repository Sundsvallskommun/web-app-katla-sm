import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// One owner for the isolated artifact location; command-line paths are never accepted.
export const backendArtifactDirectory = path.join(tmpdir(), 'katla-backend-artifact');

export function createBackendArtifact() {
  const output = backendArtifactDirectory;
  if (existsSync(output))
    throw new Error('Backend artifact already exists. Remove the previous temporary artifact before building again.');
  const rootPackage = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  mkdirSync(output, { mode: 0o700 });
  writeFileSync(
    path.join(output, 'package.json'),
    `${JSON.stringify(
      {
        name: 'katla-backend-artifact',
        private: true,
        engines: rootPackage.engines,
        packageManager: rootPackage.packageManager,
        workspaces: ['backend', 'katlor'],
        // Keep the root's runtime overrides, without installing frontend/tooling-only resolutions.
        resolutions: Object.fromEntries(
          ['qs', 'form-data', 'multer'].map((name) => [name, rootPackage.resolutions[name]]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  cpSync(path.join(root, 'yarn.lock'), path.join(output, 'yarn.lock'));
  for (const workspace of ['backend', 'katlor']) {
    const manifest = JSON.parse(readFileSync(path.join(root, workspace, 'package.json'), 'utf8'));
    delete manifest.devDependencies;
    delete manifest.scripts;
    mkdirSync(path.join(output, workspace));
    writeFileSync(path.join(output, workspace, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    cpSync(path.join(root, workspace, 'dist'), path.join(output, workspace, 'dist'), { recursive: true });
  }
  console.log(
    `Backend artifact written to ${output}. Install production dependencies with yarn install --frozen-lockfile --production --ignore-scripts in that directory.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error('Usage: node scripts/backend-artifact.mjs (no arguments).');
  createBackendArtifact();
}
