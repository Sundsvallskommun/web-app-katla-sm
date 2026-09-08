import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output || existsSync(output))
  throw new Error('Supply a new, empty artifact directory. Existing paths are never overwritten.');
const rootPackage = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
mkdirSync(output, { recursive: true });
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
