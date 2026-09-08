import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

function artifactSandbox(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'katla-artifact-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function runScript(name, directory, args = []) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(`../${name}.mjs`, import.meta.url)), ...args], {
    env: { ...process.env, TMPDIR: directory, TMP: directory, TEMP: directory },
    encoding: 'utf8',
  });
}

test('artifact tooling rejects path and Node option arguments before writing or starting a server', (t) => {
  const directory = artifactSandbox(t);
  for (const script of ['backend-artifact', 'backend-smoke']) {
    for (const argument of ['../outside', '/tmp/unowned-artifact', '--eval=throw new Error()']) {
      const result = runScript(script, directory, [argument]);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Usage:.*no arguments/);
    }
  }
  assert.equal(existsSync(path.join(directory, 'katla-backend-artifact')), false);
});

test('packaging refuses to overwrite an existing artifact or follow its directory symlink', (t) => {
  const directory = artifactSandbox(t);
  const output = path.join(directory, 'katla-backend-artifact');
  mkdirSync(output);
  const marker = path.join(output, 'keep.txt');
  writeFileSync(marker, 'previous build');
  assert.match(runScript('backend-artifact', directory).stderr, /artifact already exists/);
  assert.equal(readFileSync(marker, 'utf8'), 'previous build');
  rmSync(output, { recursive: true });
  const target = path.join(directory, 'unowned');
  mkdirSync(target);
  writeFileSync(path.join(target, 'keep.txt'), 'unowned');
  symlinkSync(target, output, 'dir');
  assert.match(runScript('backend-artifact', directory).stderr, /artifact already exists/);
  assert.equal(readFileSync(path.join(target, 'keep.txt'), 'utf8'), 'unowned');
});
