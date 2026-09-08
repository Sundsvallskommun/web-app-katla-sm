import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  connectedCheck,
  createKatla,
  instanceEnvironment,
  parseArguments,
  sessionCookie,
  validateExample,
} from '../katla.mjs';

function temporary(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'katla-tooling-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('scaffolding adds a standard Katla and cannot overwrite an existing one', (t) => {
  const repository = temporary(t);
  cpSync(new URL('../../katlor/src', import.meta.url), path.join(repository, 'katlor/src'), { recursive: true });
  const created = createKatla(repository, 'equipment-order', {
    name: 'Equipment order',
  });
  const source = readFileSync(path.join(created.directory, 'definition.ts'), 'utf8');
  assert.match(source, /KatlaDefinitionInput/);
  assert.match(source, /"flow": "schema"/);
  assert.doesNotMatch(source, /avvikelse|eventType|eventConcerns/);
  assert.match(readFileSync(path.join(repository, 'katlor/src/index.ts'), 'utf8'), /equipmentOrderKatla,/);
  assert.equal(JSON.parse(readFileSync(created.policyFile, 'utf8')).published, false);
  assert.throws(() => createKatla(repository, 'equipment-order'), /already exists/);
  assert.equal(readFileSync(path.join(created.directory, 'definition.ts'), 'utf8'), source);
  assert.throws(() => createKatla(repository, '../outside'), /lowercase/);
  assert.throws(() => createKatla(repository, 'catalogue'), /reserved/);
  validateExample(JSON.parse(readFileSync(path.join(created.directory, 'example.json'), 'utf8')), 'equipment-order');
  const config = path.join(repository, 'generated-check.json');
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ES2022',
        module: 'commonjs',
        moduleResolution: 'node',
        types: [],
        noEmit: true,
      },
      files: ['./katlor/src/index.ts'],
    }),
  );
  execFileSync(
    process.execPath,
    [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '-p', config],
    { cwd: repository, stdio: 'pipe' },
  );
});

test('a fixture must prove both accepted and rejected business inputs', () => {
  const example = JSON.parse(
    readFileSync(new URL('../../katlor/src/schema-test/example.json', import.meta.url), 'utf8'),
  );
  assert.doesNotThrow(() => validateExample(example, 'schema-test'));
  assert.throws(() => validateExample({ ...example, invalid: example.valid }, 'schema-test'), /invalid example/);
  assert.throws(() => validateExample({ ...example, valid: example.invalid }, 'schema-test'), /valid example/);
});

function session(t) {
  const directory = temporary(t);
  const filename = path.join(directory, 'browser.session.json');
  writeFileSync(
    filename,
    JSON.stringify({
      cookies: [
        {
          name: 'katla.schema-test.sid',
          value: 'local-test-session',
          domain: 'localhost',
          path: '/',
          expires: -1,
          secure: false,
        },
      ],
    }),
    { mode: 0o600 },
  );
  return filename;
}

test('session cookies are scoped to one instance and target and never accepted from a public file', (t) => {
  const filename = session(t);
  assert.equal(
    sessionCookie(filename, 'http://localhost:3001/api', 'katla.schema-test.sid'),
    'katla.schema-test.sid=local-test-session',
  );
  assert.throws(() => sessionCookie(filename, 'https://other.example/api', 'katla.schema-test.sid'), /No unique/);
  assert.throws(() => sessionCookie(filename, 'http://localhost/api', 'katla.avvikelse.sid'), /No unique/);
  chmodSync(filename, 0o644);
  assert.throws(() => sessionCookie(filename, 'http://localhost/api', 'katla.schema-test.sid'), /chmod 600/);
});

test('connected checks read identity, access, immutable schemas and required metadata without mutations', async (t) => {
  const calls = [];
  const responses = {
    '/app-context': {
      data: {
        mode: 'katla',
        katlaId: 'schema-test',
        definitionRevision: 'same',
      },
    },
    '/applications': { data: [] },
    '/schemas/latest/equipment': {
      schemaId: 'immutable-v1',
      schema: { type: 'object' },
    },
    '/schemas/immutable-v1': {
      schemaId: 'immutable-v1',
      schema: { type: 'object' },
    },
    '/supportmanagement/metadata': {
      statuses: ['DRAFT', 'NEW', 'SOLVED'].map((name) => ({ name })),
      roles: [{ name: 'REPORTER' }],
    },
  };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => responses[new URL(url).pathname.replace('/api', '')],
    };
  };
  const input = {
    apiUrl: 'http://localhost:3001/api',
    sessionFile: session(t),
    id: 'schema-test',
    definition: { forms: [{ schemaName: 'equipment' }] },
    revision: 'same',
    fetcher,
  };
  await connectedCheck(input);
  assert.equal(calls.length, 5);
  assert.ok(calls.every(({ options }) => options.method === 'GET' && options.redirect === 'error'));
  responses['/app-context'].data.definitionRevision = 'different';
  await assert.rejects(() => connectedCheck(input), /differs from this checkout/);
});

test('CLI rejects misspelled options and missing values before running commands', () => {
  assert.throws(() => parseArguments(['check', 'schema-test', '--conected']), /Unknown option/);
  assert.throws(() => parseArguments(['check', 'schema-test', '--policy']), /requires a value/);
  assert.deepEqual(parseArguments(['check', 'schema-test', '--test']), {
    command: 'check',
    id: 'schema-test',
    options: { test: true },
  });
});

test('a selected environment resolves its own policy and cannot accidentally target another Katla namespace', (t) => {
  const directory = temporary(t);
  const filename = path.join(directory, 'instance.env');
  writeFileSync(
    filename,
    'APP_MODE=katla\nKATLA_ID=equipment\nKATLA_CATALOGUE_FILE=./policy.json\nNAMESPACE=equipment\n',
  );
  const { backend, frontend } = instanceEnvironment('equipment', { 'env-file': filename }, true);
  assert.equal(backend.KATLA_CATALOGUE_FILE, path.join(directory, 'policy.json'));
  assert.equal(backend.NAMESPACE, 'equipment');
  assert.equal(backend.SESSION_COOKIE_NAME, 'katla.equipment.sid');
  assert.equal(frontend.NEXT_PUBLIC_SESSION_COOKIE_NAME, backend.SESSION_COOKIE_NAME);
  assert.throws(() => instanceEnvironment('avvikelse', { 'env-file': filename }, true), /another instance/);
});
