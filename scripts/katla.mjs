import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyDateBounds, createSchemaAjv } from '@katla/definitions/schema-validation';
import { parse } from 'dotenv';
import { tsImport } from 'tsx/esm/api';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const flags = new Set(['test', 'connected', 'help']);
const valueOptions = new Set([
  'name',
  'schema',
  'env-file',
  'policy',
  'api-url',
  'session-file',
  'frontend-port',
  'backend-port',
]);

export function parseArguments(args) {
  const options = {};
  const positional = [];
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const key = argument.slice(2);
    if (Object.hasOwn(options, key)) throw new Error(`Option --${key} was supplied twice.`);
    if (flags.has(key)) options[key] = true;
    else if (valueOptions.has(key)) {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`--${key} requires a value.`);
      options[key] = value;
    } else throw new Error(`Unknown option --${key}. Run with --help.`);
  }
  if (positional.length > 2) throw new Error('Expected one command and one Katla id (or catalogue).');
  return { command: positional[0], id: positional[1], options };
}

/** Creates the small standard definition, its example and a policy entry; never copies an application. */
export function createKatla(repository, id, options = {}) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id ?? '') || id === 'catalogue') {
    throw new Error('Choose a lowercase Katla id using letters, digits and hyphens. catalogue is reserved.');
  }
  const directory = path.join(repository, 'katlor/src', id);
  const policyFile = path.join(repository, 'deploy', `${id}.policy-entry.example.json`);
  if (existsSync(directory) || existsSync(policyFile))
    throw new Error(`${id} already exists; no files were overwritten.`);
  const registryPath = path.join(repository, 'katlor/src/index.ts');
  const registry = readFileSync(registryPath, 'utf8');
  if (!registry.includes('// katla:new imports') || !registry.includes('// katla:new registry')) {
    throw new Error('Registry markers are missing in katlor/src/index.ts; restore them before using katla:new.');
  }
  const identifier = `${id.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())}Katla`;
  const schema = options.schema ?? `${id}-arendeuppgifter`;
  const name = options.name ?? id.charAt(0).toUpperCase() + id.slice(1).replaceAll('-', ' ');
  if (!schema.trim() || schema.trim() !== schema || !name.trim() || name.trim() !== name)
    throw new Error('Name and schema must be nonempty without surrounding whitespace.');
  const input = {
    id,
    applicationName: name,
    flow: 'schema',
    forms: [{ schemaName: schema }],
  };
  const definition = `import type { KatlaDefinitionInput } from '../definition';\n\nexport const ${identifier} = ${JSON.stringify(input, null, 2)} satisfies KatlaDefinitionInput;\n`;
  const updated = registry
    .replace('// katla:new imports', `import { ${identifier} } from './${id}/definition';\n// katla:new imports`)
    .replace('// katla:new registry', `${identifier},\n  // katla:new registry`);
  const fixture = readFileSync(path.join(repository, 'katlor/src/schema-test/example.json'), 'utf8');
  const created = [];
  try {
    mkdirSync(directory);
    created.push(directory);
    writeFileSync(path.join(directory, 'definition.ts'), definition, {
      flag: 'wx',
    });
    writeFileSync(path.join(directory, 'example.json'), fixture, {
      flag: 'wx',
    });
    writeFileSync(
      path.join(directory, 'README.md'),
      `# ${name}\n\nStatus: inte ansluten. Ägare: fyll i verksamhet och utvecklingsteam.\n\nSchema: \`${schema}\`. Publicera i JSON Schema-tjänsten och ersätt \`example.json\` med representativa giltiga/ogiltiga uppgifter. Filen är testunderlag och publiceras inte automatiskt.\n\nBekräfta namespace, roller, statusarna DRAFT/NEW/SOLVED och mottagningen i Draken. Lägg policyförslaget i miljöns gemensamma katalogfil. Se [Skapa en ny Katla](../../../docs/adding-a-katla.md).\n`,
      { flag: 'wx' },
    );
    mkdirSync(path.dirname(policyFile), { recursive: true });
    writeFileSync(
      policyFile,
      `${JSON.stringify({ id, url: `https://${id}.example.invalid`, published: false, allowedGroups: [] }, null, 2)}\n`,
      { flag: 'wx' },
    );
    created.push(policyFile);
    writeFileSync(registryPath, updated);
  } catch (error) {
    for (const filename of created.reverse()) rmSync(filename, { recursive: true, force: true });
    throw error;
  }
  return { directory, policyFile };
}

export function validateExample(example, label) {
  if (
    !example ||
    typeof example !== 'object' ||
    !Object.hasOwn(example, 'schema') ||
    !Object.hasOwn(example, 'valid') ||
    !Object.hasOwn(example, 'invalid')
  ) {
    throw new Error(`${label}: example.json must contain schema, uiSchema, valid and invalid.`);
  }
  if (!example.uiSchema || typeof example.uiSchema !== 'object' || Array.isArray(example.uiSchema))
    throw new Error(`${label}: uiSchema must be an object.`);
  const ajv = createSchemaAjv(example.schema.$schema);
  const validate = ajv.compile(applyDateBounds(example.schema, example.uiSchema));
  if (!validate(example.valid))
    throw new Error(`${label}: the valid example does not satisfy its schema (${ajv.errorsText(validate.errors)}).`);
  if (validate(example.invalid)) throw new Error(`${label}: the invalid example must demonstrate a rejected input.`);
}

function run(args, cwd = root, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn('yarn', args, { cwd, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) =>
      code === 0 ? resolve() : reject(new Error(`yarn ${args.join(' ')} failed (${signal ?? code}).`)),
    );
  });
}

function readEnv(filename, required = false) {
  if (!existsSync(filename)) {
    if (required) throw new Error(`Environment file does not exist: ${filename}`);
    return {};
  }
  const values = parse(readFileSync(filename));
  if (values.KATLA_CATALOGUE_FILE) {
    values.KATLA_CATALOGUE_FILE = path.resolve(path.dirname(filename), values.KATLA_CATALOGUE_FILE);
  }
  return values;
}

export function instanceEnvironment(id, options, requireMatchingSelection = false) {
  const shared = options['env-file'] ? readEnv(path.resolve(options['env-file']), true) : {};
  const frontend = {
    ...(options['env-file'] ? {} : readEnv(path.join(root, 'frontend/.env'))),
    ...(options['env-file'] ? {} : readEnv(path.join(root, 'frontend/.env.local'))),
    ...shared,
    ...process.env,
  };
  const backend = {
    ...(options['env-file'] ? {} : readEnv(path.join(root, 'backend/.env.development.local'))),
    ...shared,
    ...process.env,
  };
  const selection = {
    APP_MODE: id === 'catalogue' ? 'catalogue' : 'katla',
    TEST: String(options.test === true),
    ALLOW_TEST_KATLA: String(options.test === true),
  };
  if (requireMatchingSelection) {
    for (const env of [frontend, backend]) {
      if ((env.APP_MODE && env.APP_MODE !== selection.APP_MODE) || (env.KATLA_ID && env.KATLA_ID !== id)) {
        throw new Error(
          'The environment file selects another instance. Supply the intended instance file with --env-file so its namespace and URLs cannot be reused accidentally.',
        );
      }
    }
  }
  const cookie = `katla.${id}.sid`;
  for (const env of [frontend, backend]) {
    Object.assign(env, selection);
    if (id === 'catalogue') delete env.KATLA_ID;
    else env.KATLA_ID = id;
    if (env.KATLA_CATALOGUE_FILE) env.KATLA_CATALOGUE_FILE = path.resolve(env.KATLA_CATALOGUE_FILE);
  }
  backend.SESSION_COOKIE_NAME ||= cookie;
  backend.SESSION_COOKIE_PATH ||= frontend.NEXT_PUBLIC_BASE_PATH || '/';
  frontend.NEXT_PUBLIC_SESSION_COOKIE_NAME ||= cookie;
  if (backend.SESSION_COOKIE_NAME !== frontend.NEXT_PUBLIC_SESSION_COOKIE_NAME)
    throw new Error('Frontend and backend session cookie names differ. Update the environment file.');
  frontend.HEALTH_AUTH ||= 'false';
  return { frontend, backend };
}

async function checkPolicy(filename, id, options) {
  const { validateCataloguePolicy } = await tsImport(
    path.join(root, 'backend/src/config/catalogue-policy.ts'),
    import.meta.url,
  );
  const policy = validateCataloguePolicy(JSON.parse(readFileSync(filename, 'utf8')), {
    allowTestDefinitions: options.test === true,
    production: !options.test,
  });
  if (id !== 'catalogue' && !policy.applications.some((app) => app.id === id))
    throw new Error(`${id} is missing from the catalogue policy.`);
  console.log(
    `Policy ${policy.revision}: valid, ${policy.applications.length} configured application(s). Access groups remain on the server.`,
  );
}

/** Reads only an explicitly supplied browser session for the target origin; credentials never go into command arguments or logs. */
export function sessionCookie(filename, apiUrl, name, now = Date.now()) {
  if (process.platform !== 'win32' && statSync(filename).mode & 0o077)
    throw new Error('Session file is readable by others. Run chmod 600 on the session file.');
  const state = JSON.parse(readFileSync(filename, 'utf8'));
  if (!Array.isArray(state.cookies)) throw new Error('Session file must be Playwright storageState JSON with cookies.');
  const target = new URL(apiUrl);
  const cookies = state.cookies.filter((cookie) => {
    if (cookie.name !== name || typeof cookie.domain !== 'string' || typeof cookie.path !== 'string') return false;
    const domain = cookie.domain.replace(/^\./, '');
    const domainMatches =
      target.hostname === domain || (cookie.domain.startsWith('.') && target.hostname.endsWith(`.${domain}`));
    const pathMatches =
      target.pathname === cookie.path ||
      target.pathname.startsWith(cookie.path.endsWith('/') ? cookie.path : `${cookie.path}/`);
    return (
      domainMatches &&
      pathMatches &&
      (!cookie.secure || target.protocol === 'https:') &&
      (cookie.expires === -1 || cookie.expires * 1000 > now)
    );
  });
  if (
    cookies.length !== 1 ||
    typeof cookies[0].value !== 'string' ||
    !cookies[0].value ||
    /[\r\n;]/.test(cookies[0].value)
  )
    throw new Error(
      'No unique, unexpired instance session matches the API address. Log into that instance and export a fresh session.',
    );
  return `${name}=${cookies[0].value}`;
}

export async function connectedCheck({ apiUrl, sessionFile, id, definition, revision, fetcher = fetch }) {
  const base = new URL(apiUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
    throw new Error('API URL must be HTTP(S), without credentials, query or fragment.');
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))
    throw new Error('Use HTTPS for a remote authenticated connection.');
  const cookie = sessionCookie(sessionFile, base.href, `katla.${id}.sid`);
  async function get(endpoint) {
    const url = `${base.href.replace(/\/$/, '')}${endpoint}`;
    let response;
    try {
      response = await fetcher(url, {
        method: 'GET',
        headers: { Cookie: cookie, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        `GET ${endpoint} failed. Check the API address, TLS and login; redirects are deliberately refused.`,
      );
    }
    if (!response.ok)
      throw new Error(`GET ${endpoint}: HTTP ${response.status}. Check login, group access and service subscriptions.`);
    return response.json();
  }
  const context = (await get('/app-context')).data;
  if (
    !context ||
    context.mode !== (id === 'catalogue' ? 'catalogue' : 'katla') ||
    (definition && (context.katlaId !== id || context.definitionRevision !== revision))
  )
    throw new Error(
      'Backend mode, Katla id or definition revision differs from this checkout. Deploy the matching release pair.',
    );
  const applications = (await get('/applications')).data;
  if (!Array.isArray(applications)) throw new Error('Invalid applications response.');
  if (definition) {
    for (const { schemaName } of definition.forms) {
      const latest = await get(`/schemas/latest/${encodeURIComponent(schemaName)}`);
      if (typeof latest.schemaId !== 'string' || !latest.schemaId || !latest.schema || latest.schema.type !== 'object')
        throw new Error(`${schemaName}: missing immutable schemaId or unsupported non-object form schema.`);
      const saved = await get(`/schemas/${encodeURIComponent(latest.schemaId)}`);
      if (saved.schemaId !== latest.schemaId)
        throw new Error(`${schemaName}: reading the immutable schemaId returned a different identity.`);
    }
    const metadata = await get('/supportmanagement/metadata');
    const statuses = new Set(
      metadata.statuses?.filter((status) => status.deprecated !== true).map((status) => status.name),
    );
    for (const status of ['DRAFT', 'NEW', 'SOLVED'])
      if (!statuses.has(status)) throw new Error(`Recipient metadata is missing required status ${status}.`);
    if (!metadata.roles?.some((role) => role.name === 'REPORTER' && role.deprecated !== true))
      throw new Error('Recipient metadata is missing REPORTER.');
  }
  return { applicationCount: applications.length };
}

async function startDevelopment(frontend, backend, options) {
  frontend.NEXT_DIST_DIR ||= `.next-${frontend.KATLA_ID || 'catalogue'}`;
  frontend.PORT = options['frontend-port'] ?? frontend.PORT ?? '3000';
  backend.PORT = options['backend-port'] ?? backend.PORT ?? '3001';
  if (frontend.PORT === backend.PORT) throw new Error('Frontend and backend require different ports.');
  backend.NODE_ENV = 'development';
  backend.ENVIRONMENT ||= 'LOCAL';
  frontend.NEXT_PUBLIC_API_URL ||= `http://localhost:${backend.PORT}${backend.BASE_URL_PREFIX || '/api'}`;
  const { loadRuntimeConfiguration, readCataloguePolicy } = await tsImport(
    path.join(root, 'backend/src/config/katla-config.ts'),
    import.meta.url,
  );
  readCataloguePolicy(loadRuntimeConfiguration(backend));
  const children = [
    spawn('yarn', ['dev'], {
      cwd: path.join(root, 'backend'),
      env: backend,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    }),
    spawn('yarn', ['dev'], {
      cwd: path.join(root, 'frontend'),
      env: frontend,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    }),
  ];
  const stop = () => {
    for (const child of children) {
      if (child.pid && child.exitCode === null) {
        try {
          process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM');
        } catch {
          /* process already exited */
        }
      }
    }
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    await Promise.race(
      children.map(
        (child) =>
          new Promise((resolve, reject) => {
            child.once('error', reject);
            child.once('exit', (code, signal) =>
              code === 0 || signal ? resolve() : reject(new Error(`Development server exited with code ${code}.`)),
            );
          }),
      ),
    );
  } finally {
    stop();
  }
}

export async function main(args) {
  const { command, id, options } = parseArguments(args);
  if (options.help) {
    console.log(
      'yarn katla:new <id> [--name "App name"] [--schema schema-name]\nyarn katla:check <id|catalogue> [--test] [--policy file] [--env-file file]\nyarn katla:check <id|catalogue> --connected --api-url https://host/api --session-file file [--test]\nyarn katla:dev <id|catalogue> [--test] [--env-file file] [--frontend-port 3000] [--backend-port 3001]\nyarn katla:build <id|catalogue> [--test] [--env-file file]\nGuide: docs/adding-a-katla.md',
    );
    return;
  }
  if (!['new', 'check', 'dev', 'build'].includes(command) || !id)
    throw new Error('Specify a command and Katla id (or catalogue). Run yarn katla:check --help.');
  if (command === 'new') {
    const created = createKatla(root, id, options);
    console.log(
      `Created ${path.relative(root, created.directory)} and ${path.relative(root, created.policyFile)}.\nNext: replace the example, publish the schema, configure the shared policy, then yarn katla:check ${id}.\nGuide: docs/adding-a-katla.md`,
    );
    return;
  }
  await run(['definitions:build']);
  const { getKatlaDefinition } = require('@katla/definitions');
  const { definitionRevision } = require('@katla/definitions/server');
  const definition =
    id === 'catalogue' ? undefined : getKatlaDefinition(id, { allowTestDefinitions: options.test === true });
  const revision = definition ? definitionRevision(definition) : undefined;
  const { frontend, backend } = instanceEnvironment(id, options, command === 'dev' || !!options['env-file']);
  if (command === 'check') {
    console.log(
      JSON.stringify(definition ? { definition, definitionRevision: revision } : { mode: 'catalogue' }, null, 2),
    );
    const examplePath = path.join(root, 'katlor/src', id, 'example.json');
    if (definition?.flow === 'schema') {
      if (!existsSync(examplePath))
        throw new Error(`${id}: missing example.json. Add representative valid and invalid inputs.`);
      validateExample(JSON.parse(readFileSync(examplePath, 'utf8')), id);
      console.log('Local schema example: valid input accepted, invalid input rejected.');
    }
    const policy = options.policy ?? backend.KATLA_CATALOGUE_FILE;
    if (policy) await checkPolicy(path.resolve(policy), id, options);
    else console.log('Policy not checked: supply --policy or an environment file with KATLA_CATALOGUE_FILE.');
    if (options['env-file']) {
      const { loadRuntimeConfiguration, readCataloguePolicy } = await tsImport(
        path.join(root, 'backend/src/config/katla-config.ts'),
        import.meta.url,
      );
      readCataloguePolicy(loadRuntimeConfiguration(backend));
      console.log(
        'Runtime selection, required connection settings and instance cookie configuration: valid. No secrets printed.',
      );
    }
    if (options.connected) {
      if (!options['api-url'] || !options['session-file'])
        throw new Error(
          '--connected requires explicit --api-url and --session-file. Use a session exported after login to that test instance.',
        );
      const result = await connectedCheck({
        apiUrl: options['api-url'],
        sessionFile: options['session-file'],
        id,
        definition,
        revision,
      });
      console.log(
        `Read-only connection checks passed; ${result.applicationCount} application(s) visible to this session. No errands were written. Draken reception and real SSO still require verification.`,
      );
    } else console.log('Local checks passed. External services, SSO and Draken reception have not been verified.');
  } else if (command === 'dev') {
    await startDevelopment(frontend, backend, options);
  } else {
    // The build command has one reviewable output path; local dev instances use their own .next-<id>.
    delete frontend.NEXT_DIST_DIR;
    await run(['build'], path.join(root, 'backend'), backend);
    await run(['build'], path.join(root, 'frontend'), frontend);
    const manifest = {
      mode: id === 'catalogue' ? 'catalogue' : 'katla',
      ...(definition ? { katlaId: id, definitionRevision: revision } : {}),
      apiUrl: frontend.NEXT_PUBLIC_API_URL,
      basePath: frontend.NEXT_PUBLIC_BASE_PATH || '',
    };
    mkdirSync(path.join(root, '.katla'), { recursive: true });
    writeFileSync(path.join(root, '.katla', `${id}.build.json`), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `Built ${id}. Manifest: .katla/${id}.build.json. Prepare and check standalone with yarn standalone:prepare && yarn standalone:check.`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`Katla: ${error.message}`);
    process.exitCode = 1;
  });
}
