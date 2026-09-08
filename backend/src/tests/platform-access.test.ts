import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import express from 'express';
import { useExpressServer } from 'routing-controllers';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { canAccessApplication, validateCataloguePolicy } from '@/config/catalogue-policy';
import { loadRuntimeConfiguration, readCataloguePolicy } from '@/config/katla-config';
import { controllersForMode } from '@/controllers/runtime-controllers';
import errorMiddleware from '@/middlewares/error.middleware';
import ApiService from '@/services/api.service';
import { createVerifiedSessionClaims } from '@/services/authorization.service';

// Two independent registered production-shaped fixtures, only within this test process.
vi.mock('@katla/definitions', async importOriginal => {
  const actual = await importOriginal<typeof import('@katla/definitions')>();
  return {
    ...actual,
    getKatlaDefinition: (id: string, options?: { allowTestDefinitions?: boolean }) =>
      id === 'second-fixture'
        ? { ...actual.getKatlaDefinition('avvikelse'), id, applicationName: 'Andra Katlan' }
        : actual.getKatlaDefinition(id, options),
  };
});

let directory: string;
let policyFile: string;
const policy = () => ({
  revision: 'policy-v1',
  catalogueUrl: 'https://katla.example.test',
  sessionMaxAgeSeconds: 3600,
  applications: [
    { id: 'avvikelse', url: 'https://katla.example.test/avvikelse', published: true, allowedGroups: ['Group-One'] },
    { id: 'second-fixture', url: 'https://katla.example.test/second', published: true, allowedGroups: ['group-two'] },
  ],
});
const savePolicy = (value: unknown) => {
  writeFileSync(policyFile, JSON.stringify(value));
};

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'katla-policy-test-'));
  policyFile = join(directory, 'catalogue.json');
  savePolicy(policy());
  vi.stubEnv('KATLA_CATALOGUE_FILE', policyFile);
  vi.stubEnv('APP_MODE', 'catalogue');
  vi.stubEnv('KATLA_ID', undefined);
  vi.stubEnv('SESSION_COOKIE_NAME', 'katla.catalogue.sid');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});

const server = (groups: string[] | undefined, claimsOverride: object = {}) => {
  const configuration = loadRuntimeConfiguration();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.defineProperty(req, 'isAuthenticated', { value: () => groups !== undefined });
    if (groups !== undefined)
      req.user = {
        username: 'max',
        name: 'Max Eriksson',
        firstName: 'Max',
        lastName: 'Eriksson',
        ...createVerifiedSessionClaims(groups, configuration),
        ...claimsOverride,
      };
    next();
  });
  useExpressServer(app, { routePrefix: '/api', controllers: controllersForMode(configuration.mode), defaultErrorHandler: false });
  app.use(errorMiddleware);
  return app;
};

describe('Mina Katlor server access', () => {
  it.each([
    { groups: [], expected: [] },
    { groups: [' group-one '], expected: ['avvikelse'] },
    { groups: ['GROUP-ONE', 'group-two'], expected: ['avvikelse', 'second-fixture'] },
  ])('returns only assigned published Katlor for $groups', async ({ groups, expected }) => {
    const response = await request(server(groups)).get('/api/applications').expect(200);
    const body = response.body as { data: { id: string }[] };
    expect(body.data.map(application => application.id)).toEqual(expected);
    expect(JSON.stringify(body)).not.toMatch(/allowedGroups|group-one|sessionMaxAgeSeconds|revision/);
  });

  it('does not expose unpublished apps but its own direct instance can still be accessed', async () => {
    const input = policy();
    const first = input.applications[0];
    if (!first) throw new Error('Missing fixture');
    first.published = false;
    savePolicy(input);
    const response = await request(server(['group-one']))
      .get('/api/applications')
      .expect(200);
    expect(response.body).toEqual({ data: [], message: 'success' });
    expect(canAccessApplication(validateCataloguePolicy(input), 'avvikelse', ['GROUP-ONE'])).toBe(true);
  });

  it('requires authentication even when request headers name an allowed group', async () => {
    const response = await request(server(undefined)).get('/api/applications').set('X-Groups', 'group-one');
    expect(response.status).toBe(401);
  });

  it('returns identity publicly without policy, groups or service secrets', async () => {
    const response = await request(server(undefined)).get('/api/app-context').expect(200);
    expect(response.body).toEqual({ data: { mode: 'catalogue', catalogueUrl: 'https://katla.example.test' }, message: 'success' });
  });

  it('does not register errand, schema, employee or citizen endpoints in catalogue mode', async () => {
    const api = server(['group-one']);
    const call = vi.spyOn(ApiService.prototype, 'get');
    for (const path of [
      '/supportmanagement/metadata',
      '/schemas/latest/test',
      '/supportmanagement/errands',
      '/employee/personal/max',
      '/citizen/person/200001010000',
    ]) {
      await request(api).get(`/api${path}`).expect(404);
    }
    await request(api).post('/api/supportmanagement/errand/create').send({}).expect(404);
    await request(api).get('/api/health/up').expect(200, { status: 'OK' });
    expect(call).not.toHaveBeenCalled();
  });

  it('requires fresh claims and prevents reusing another instance session', async () => {
    await request(server(['group-one'], { groupsVerifiedAt: Date.now() - 3600001 }))
      .get('/api/me')
      .expect(401, { message: 'SESSION_CLAIMS_EXPIRED' });
    await request(server(['group-one'], { sessionInstanceId: 'katla:other' }))
      .get('/api/me')
      .expect(401, { message: 'SESSION_INSTANCE_MISMATCH' });
  });

  it('denies direct Katla API access using the same policy and applies policy removal immediately', async () => {
    vi.stubEnv('APP_MODE', 'katla');
    vi.stubEnv('KATLA_ID', 'avvikelse');
    vi.stubEnv('SESSION_COOKIE_NAME', 'katla.avvikelse.sid');
    const denied = server(['group-two']);
    const upstream = vi.spyOn(ApiService.prototype, 'get');
    await request(denied).get('/api/supportmanagement/metadata').expect(403, { message: 'KATLA_ACCESS_DENIED' });
    expect(upstream).not.toHaveBeenCalled();
    const allowed = server(['group-one']);
    await request(allowed).get('/api/me').expect(200);
    const changed = policy();
    const first = changed.applications[0];
    if (!first) throw new Error('Missing fixture');
    first.allowedGroups = [];
    savePolicy(changed);
    await request(allowed).get('/api/me').expect(403);
    writeFileSync(policyFile, '{broken');
    await request(allowed).get('/api/me').expect(503, { message: 'ACCESS_POLICY_UNAVAILABLE' });
  });
});

describe('validated runtime configuration', () => {
  it('starts catalogue mode without case service secrets', () => {
    for (const field of ['API_BASE_URL', 'CLIENT_KEY', 'CLIENT_SECRET', 'MUNICIPALITY_ID', 'NAMESPACE']) vi.stubEnv(field, undefined);
    expect(() => readCataloguePolicy(loadRuntimeConfiguration())).not.toThrow();
  });
  it('rejects ambiguous modes, duplicate IDs, unsafe production URLs and unregistered IDs', () => {
    expect(() => loadRuntimeConfiguration({ ...process.env, APP_MODE: 'other' })).toThrow('APP_MODE');
    const duplicate = policy();
    const first = duplicate.applications[0];
    if (!first) throw new Error('Missing fixture');
    duplicate.applications.push(first);
    expect(() => validateCataloguePolicy(duplicate)).toThrow('dubbelt');
    expect(() => validateCataloguePolicy({ ...policy(), catalogueUrl: 'http://example.test' }, { production: true })).toThrow('HTTPS');
    expect(() => validateCataloguePolicy({ ...policy(), applications: [{ ...policy().applications[0], id: 'unknown' }] })).toThrow();
  });
  it('rejects parallel group config and mismatched cookie names', () => {
    expect(() => loadRuntimeConfiguration({ ...process.env, AUTHORIZED_GROUPS: 'legacy' })).toThrow('ersatt');
    expect(() => loadRuntimeConfiguration({ ...process.env, SESSION_COOKIE_NAME: 'connect.sid' })).toThrow('katla.catalogue.sid');
  });
  it('requires the Katla identity and its real upstream configuration', () => {
    const katla = { ...process.env, APP_MODE: 'katla', KATLA_ID: 'avvikelse', SESSION_COOKIE_NAME: 'katla.avvikelse.sid' };
    expect(() => loadRuntimeConfiguration({ ...katla, KATLA_ID: undefined })).toThrow('KATLA_ID');
    expect(() => loadRuntimeConfiguration({ ...katla, NAMESPACE: undefined })).toThrow('NAMESPACE');
    expect(() => loadRuntimeConfiguration({ ...katla, CLIENT_SECRET: '{{INSERT SECRET}}' })).toThrow('CLIENT_SECRET');
    expect(() => loadRuntimeConfiguration({ ...katla, API_BASE_URL: 'broken' })).toThrow('API_BASE_URL');
  });

  it('exposes Katla identity with its content revision and rejects test definitions in production', async () => {
    vi.stubEnv('APP_MODE', 'katla');
    vi.stubEnv('KATLA_ID', 'avvikelse');
    vi.stubEnv('SESSION_COOKIE_NAME', 'katla.avvikelse.sid');
    const configuration = loadRuntimeConfiguration();
    const response = await request(server(undefined)).get('/api/app-context').expect(200);
    expect(response.body).toMatchObject({
      data: {
        mode: 'katla',
        katlaId: 'avvikelse',
        definitionRevision: configuration.mode === 'katla' ? configuration.definitionRevision : undefined,
      },
    });
    expect(() => loadRuntimeConfiguration({ ...process.env, NODE_ENV: 'production', ENVIRONMENT: '', ALLOW_TEST_KATLA: 'true' })).toThrow(
      'produktion',
    );
  });
});
