import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standalone = path.join(root, 'frontend/.next/standalone');
const command = process.argv[2];
if (command === 'prepare') {
  if (!existsSync(path.join(standalone, 'frontend/server.js')))
    throw new Error('Build the workspace frontend first. Missing standalone/frontend/server.js.');
  cpSync(path.join(root, 'frontend/public'), path.join(standalone, 'frontend/public'), { recursive: true });
  cpSync(path.join(root, 'frontend/.next/static'), path.join(standalone, 'frontend/.next/static'), { recursive: true });
  console.log('Standalone public and static assets prepared.');
} else if (command === 'check') {
  // A temporary directory prevents Node from finding missing packages in the source checkout.
  const artifact = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'katla-standalone-')));
  let child;
  try {
    cpSync(standalone, artifact, { recursive: true, dereference: true });
    const entry = path.join(artifact, 'frontend/server.js');
    const artifactRequire = createRequire(entry);
    // Next bundles application imports; the traced workspace snapshot verifies the baked identity.
    const definitionPackage = path.join(artifact, 'katlor');
    for (const name of ['next', definitionPackage])
      assert.ok(
        artifactRequire.resolve(name).startsWith(`${artifact}${path.sep}`),
        `${name} must be packaged inside standalone`,
      );
    // Sharp belongs to Next's image optimizer and Yarn may install it beneath Next.
    const nextRequire = createRequire(artifactRequire.resolve('next/package.json'));
    assert.ok(
      nextRequire.resolve('sharp').startsWith(`${artifact}${path.sep}`),
      'Next must resolve its packaged Sharp',
    );
    const sharp = nextRequire('sharp');
    for (const format of ['avif', 'webp']) {
      const output = await sharp({
        create: { width: 64, height: 64, channels: 3, background: '#624ee3' },
      })
        .resize(32, 32)
        .toFormat(format)
        .toBuffer();
      const metadata = await sharp(output).metadata();
      assert.equal(metadata.width, 32);
      assert.equal(metadata.height, 32);
      assert.equal(metadata.format, format === 'avif' ? 'heif' : 'webp');
    }
    const configuration = JSON.parse(
      readFileSync(path.join(artifact, 'frontend/.next/required-server-files.json'), 'utf8'),
    ).config;
    const baked = configuration.env;
    if (baked.NEXT_PUBLIC_APP_MODE === 'katla') {
      const definition = artifactRequire(definitionPackage).getKatlaDefinition(baked.NEXT_PUBLIC_KATLA_ID, {
        allowTestDefinitions: baked.NEXT_PUBLIC_ALLOW_TEST_DEFINITIONS === 'true',
      });
      assert.equal(
        artifactRequire(path.join(definitionPackage, 'dist/server.js')).definitionRevision(definition),
        baked.NEXT_PUBLIC_DEFINITION_REVISION,
      );
    } else assert.equal(baked.NEXT_PUBLIC_APP_MODE, 'catalogue');
    const port = process.env.SMOKE_PORT || '3199';
    child = spawn(process.execPath, [entry], {
      cwd: artifact,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: port,
      },
      stdio: 'pipe',
    });
    child.stderr.on('data', (data) => process.stderr.write(data));
    const url = `http://127.0.0.1:${port}${configuration.basePath || ''}/login`;
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (child.exitCode !== null) throw new Error(`Standalone process exited with code ${child.exitCode}.`);
      try {
        const response = await fetch(url, {
          redirect: 'manual',
          signal: AbortSignal.timeout(1000),
        });
        ready = response.status >= 200 && response.status < 400;
      } catch {
        /* startup in progress */
      }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'Standalone must serve its login route without source checkout access');
    console.log(
      'Isolated frontend artifact: login responds, definition revision matches, Sharp encodes/decodes AVIF and WebP.',
    );
  } finally {
    if (child?.exitCode === null) {
      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('exit', resolve));
    }
    rmSync(artifact, { recursive: true, force: true });
  }
} else throw new Error('Use standalone.mjs prepare or check.');
