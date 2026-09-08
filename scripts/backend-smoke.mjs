import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';

import { backendArtifactDirectory } from './backend-artifact.mjs';

if (process.argv.length !== 2) throw new Error('Usage: node scripts/backend-smoke.mjs (no arguments).');
const temporary = await mkdtemp(join(tmpdir(), 'katla-backend-smoke-'));
const portProbe = createServer();
await new Promise((done) => portProbe.listen(0, '127.0.0.1', done));
const address = portProbe.address();
if (!address || typeof address === 'string') throw new Error('Could not reserve a smoke-test port');
const port = address.port;
await new Promise((done) => portProbe.close(done));
const origin = `http://127.0.0.1:${port}`;
const policy = join(temporary, 'catalogue.json');
await writeFile(
  policy,
  JSON.stringify({ revision: 'isolated-smoke', catalogueUrl: origin, sessionMaxAgeSeconds: 3600, applications: [] }),
);
// Deliberately omit every upstream client secret and start outside the source checkout.
const child = spawn(process.execPath, ['--', join(backendArtifactDirectory, 'backend/dist/server.js')], {
  cwd: temporary,
  env: {
    PATH: process.env.PATH,
    NODE_ENV: 'production',
    ENVIRONMENT: 'LOCAL',
    APP_MODE: 'catalogue',
    PORT: String(port),
    APP_NAME: 'Mina Katlor',
    KATLA_CATALOGUE_FILE: policy,
    SECRET_KEY: randomBytes(32).toString('hex'),
    SESSION_COOKIE_NAME: 'katla.catalogue.sid',
    SESSION_COOKIE_PATH: '/',
    SESSION_MEMORY: 'true',
    BASE_URL_PREFIX: '/api',
    ORIGIN: origin,
    CREDENTIALS: 'true',
    SWAGGER_ENABLED: 'false',
    LOG_DIR: './logs',
    SAML_CALLBACK_URL: `${origin}/api/saml/login/callback`,
    SAML_LOGOUT_CALLBACK_URL: `${origin}/api/saml/logout/callback`,
    SAML_FAILURE_REDIRECT: `${origin}/login`,
    SAML_SUCCESS_REDIRECT: `${origin}/katlor`,
    SAML_ENTRY_SSO: `${origin}/idp`,
    SAML_ISSUER: 'isolated-smoke',
    SAML_IDP_PUBLIC_CERT: 'unused-smoke-certificate',
    SAML_PRIVATE_KEY: 'unused-smoke-key',
    SAML_PUBLIC_KEY: 'unused-smoke-public-key',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Isolated backend stopped before readiness:\n${output}`);
    try {
      const response = await fetch(`${origin}/api/health/up`);
      ready = response.ok;
      if (ready) break;
    } catch {
      /* Process may still be starting. */
    }
    await pause(100);
  }
  assert.ok(ready, `Backend did not become ready:\n${output}`);
  const context = await fetch(`${origin}/api/app-context`);
  assert.equal(context.status, 200);
  assert.deepEqual(await context.json(), { data: { mode: 'catalogue', catalogueUrl: origin }, message: 'success' });
  assert.equal((await fetch(`${origin}/api/applications`)).status, 401);
  for (const path of [
    '/schemas/latest/test',
    '/supportmanagement/metadata',
    '/supportmanagement/errands',
    '/employee/personal/max',
    '/citizen/person/200001010000',
  ]) {
    assert.equal((await fetch(`${origin}/api${path}`)).status, 404, path);
  }
  assert.equal(
    (
      await fetch(`${origin}/api/supportmanagement/errand/create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
    ).status,
    404,
  );
  console.log(
    'Backend artifact verified: isolated catalogue startup, identity, authentication and absence of case endpoints. No IdP or case-system verification performed.',
  );
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await new Promise((done) => child.once('exit', done));
  await rm(temporary, { recursive: true, force: true });
}
