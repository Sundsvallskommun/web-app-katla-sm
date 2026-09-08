import { getKatlaDefinition } from '@katla/definitions';
import { definitionRevision } from '@katla/definitions/server';
import express from 'express';
import { useExpressServer } from 'routing-controllers';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as runtime from '@/config/katla-config';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { SupportManagementConversationController } from '@/controllers/supportmanagement-conversation.controller';
import { Errand, JsonParameter, Label } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import errorMiddleware from '@/middlewares/error.middleware';
import ApiService from '@/services/api.service';
import { createVerifiedSessionClaims } from '@/services/authorization.service';
import schemaFixture from '@/tests/fixtures/schemas/avvikelse-plats-handelse.schema.json';

const schemaDefinition = getKatlaDefinition('schema-test', { allowTestDefinitions: true });
const avvikelseDefinition = getKatlaDefinition('avvikelse-test', { allowTestDefinitions: true });
const schemaName = schemaDefinition.forms[0]?.schemaName ?? '';
// Upstream's generated JsonNode describes Jackson internals; its wire value is arbitrary JSON.
const parameter = (key = schemaName, schemaId = 'schema-v1', value: unknown = { message: 'Ett ärende' }): JsonParameter => ({
  key,
  schemaId,
  value: value as JsonParameter['value'],
});
let persisted: Errand | undefined;
let metadata: Label[];
const fakeUpstream = () =>
  vi.spyOn(ApiService.prototype, 'get').mockImplementation(config => {
    const url = config.url ?? '';
    if (url.endsWith('/metadata')) return Promise.resolve({ data: { labels: { labelStructure: metadata } }, message: 'success' });
    if (url.includes('/schemas/'))
      return Promise.resolve({
        data: {
          id: url.endsWith('schema-v1') ? 'schema-v1' : 'saved-v0',
          name: url.includes('saved-v0') ? 'retired-form' : schemaName,
          value: { type: 'object', required: ['message'], properties: { message: { type: 'string', minLength: 1 } } },
        },
        message: 'success',
      });
    if (url.endsWith('/errands/errand-1')) return Promise.resolve({ data: persisted, message: 'success' });
    if (url.includes('/errands?')) return Promise.resolve({ data: { content: persisted ? [persisted] : [] }, message: 'success' });
    return Promise.resolve({ data: [], message: 'success' });
  });
const server = () => {
  const configuration = runtime.loadRuntimeConfiguration();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.defineProperty(req, 'isAuthenticated', { value: () => true });
    req.user = { username: 'max', ...createVerifiedSessionClaims(['katla-avvikelse'], configuration) };
    next();
  });
  useExpressServer(app, {
    routePrefix: '/api',
    controllers: [SupportManagementController, SupportManagementConversationController],
    defaultErrorHandler: false,
  });
  app.use(errorMiddleware);
  return app;
};

beforeEach(() => {
  const configuration = runtime.loadRuntimeConfiguration();
  vi.spyOn(runtime, 'loadRuntimeConfiguration').mockReturnValue({
    ...configuration,
    mode: 'katla',
    katlaId: 'avvikelse',
    definition: schemaDefinition,
    definitionRevision: definitionRevision(schemaDefinition),
  });
  persisted = { id: 'errand-1', reporterUserId: 'max', status: 'DRAFT', version: 3, jsonParameters: [parameter()] };
  metadata = [];
});
afterEach(() => vi.restoreAllMocks());

describe('server-owned errand boundary', () => {
  it('submits a schema Katla without avvikelse fields and binds reporter to the session', async () => {
    fakeUpstream();
    const post = vi
      .spyOn(ApiService.prototype, 'post')
      .mockResolvedValue({ data: { id: 'created', reporterUserId: 'max', stakeholders: [] }, message: 'success' });
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter()], reporterUserId: 'someone-else' })
      .expect(200);
    expect(post.mock.calls[0]?.[0].data).toMatchObject({ reporterUserId: 'max', labels: [], jsonParameters: [parameter()] });
  });

  it('rejects invalid submitted schema values while allowing a draft with its exact identity', async () => {
    fakeUpstream();
    const post = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'created', stakeholders: [] }, message: 'success' });
    const body = { jsonParameters: [parameter(schemaName, 'schema-v1', {})] };
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ ...body, status: 'NEW' })
      .expect(400);
    expect(post).not.toHaveBeenCalled();
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ ...body, status: 'DRAFT' })
      .expect(200);
  });

  it('creates drafts only after every configured form has its immutable reference', async () => {
    const configuration = runtime.loadRuntimeConfiguration();
    const definition = { ...schemaDefinition, forms: [...schemaDefinition.forms, { schemaName: 'second-form' }] };
    vi.mocked(runtime.loadRuntimeConfiguration).mockReturnValue({
      ...configuration,
      mode: 'katla',
      katlaId: 'avvikelse',
      definition,
      definitionRevision: definitionRevision(definition),
    });
    vi.spyOn(ApiService.prototype, 'get').mockImplementation(config =>
      Promise.resolve({
        data: config.url?.endsWith('/second-v1')
          ? { id: 'second-v1', name: 'second-form', value: { type: 'object', required: ['required-later'] } }
          : { id: 'schema-v1', name: schemaName, value: { type: 'object', required: ['required-later'] } },
        message: 'success',
      }),
    );
    const post = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'created', stakeholders: [] }, message: 'success' });
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'DRAFT', jsonParameters: [parameter(schemaName, 'schema-v1', {})] })
      .expect(400, { message: 'REQUIRED_SCHEMA_MISSING' });
    expect(post).not.toHaveBeenCalled();
    const full = [parameter(schemaName, 'schema-v1', {}), parameter('second-form', 'second-v1', {})];
    await request(server()).post('/api/supportmanagement/errand/create').send({ status: 'DRAFT', jsonParameters: full }).expect(200);
    expect(post.mock.calls[0]?.[0].data).toMatchObject({ jsonParameters: full });
  });

  it('keeps retired saved form keys and IDs when current definitions have changed', async () => {
    const saved = parameter('retired-form', 'saved-v0');
    persisted = { ...persisted, jsonParameters: [saved] };
    const get = fakeUpstream();
    const patch = vi
      .spyOn(ApiService.prototype, 'patch')
      .mockResolvedValue({ data: { ...persisted, status: 'NEW', stakeholders: [] }, message: 'success' });
    await request(server())
      .patch('/api/supportmanagement/errand/save')
      .send({ id: 'errand-1', status: 'NEW', jsonParameters: [saved] })
      .expect(200);
    expect(patch.mock.calls[0]?.[0].data).toMatchObject({ jsonParameters: [saved], version: 3 });
    expect(get.mock.calls.some(([config]) => config.url?.endsWith('/schemas/saved-v0'))).toBe(true);
    expect(get.mock.calls.some(([config]) => config.url?.includes('/latest'))).toBe(false);
  });

  it.each([{ jsonParameters: [] }, { jsonParameters: [parameter(schemaName, 'new-version')] }])(
    'prevents deleting or silently changing saved schema references: %s',
    async body => {
      fakeUpstream();
      const patch = vi.spyOn(ApiService.prototype, 'patch');
      await request(server())
        .patch('/api/supportmanagement/errand/errand-1')
        .send({ ...body, status: 'NEW' })
        .expect(409);
      expect(patch).not.toHaveBeenCalled();
    },
  );

  it('blocks all direct errand and conversation operations for another reporter', async () => {
    persisted = { ...persisted, reporterUserId: 'someone-else' };
    fakeUpstream();
    const patch = vi.spyOn(ApiService.prototype, 'patch');
    const post = vi.spyOn(ApiService.prototype, 'post');
    const app = server();
    await request(app).get('/api/supportmanagement/errand/CASE-1').expect(404);
    await request(app).patch('/api/supportmanagement/errand/errand-1').send({ status: 'NEW' }).expect(404);
    await request(app).get('/api/supportmanagement/errand/errand-1/conversations').expect(404);
    await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Hej' }).expect(404);
    expect(patch).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects malformed saved JSON parameters with a client error', async () => {
    fakeUpstream();
    await request(server())
      .patch('/api/supportmanagement/errand/errand-1')
      .send({ status: 'NEW', jsonParameters: [null] })
      .expect(400, { message: 'JSON_PARAMETERS_INVALID' });
  });

  it('cannot resubmit an already submitted errand or set handling statuses', async () => {
    persisted = { ...persisted, status: 'NEW' };
    fakeUpstream();
    await request(server()).patch('/api/supportmanagement/errand/errand-1').send({ status: 'NEW' }).expect(409);
    await request(server()).post('/api/supportmanagement/errand/create').send({ status: 'SOLVED' }).expect(400);
  });

  it('rejects client labels in the schema flow', async () => {
    fakeUpstream();
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter()], labels: [{ resourceName: 'GRANT_ACCESS' }] })
      .expect(400);
  });

  it('derives avvikelse access labels from current metadata and ignores forged client labels', async () => {
    const configuration = runtime.loadRuntimeConfiguration();
    vi.mocked(runtime.loadRuntimeConfiguration).mockReturnValue({
      ...configuration,
      mode: 'katla',
      katlaId: 'avvikelse',
      definition: avvikelseDefinition,
      definitionRevision: definitionRevision(avvikelseDefinition),
    });
    metadata = [
      { classification: 'TYPE', resourceName: 'REPORT_TYPE', labels: [{ id: 'deviation', classification: 'TYPE', resourceName: 'DEVIATION' }] },
      {
        classification: 'PLACE',
        resourceName: 'platsstruktur',
        labels: [{ id: 'real-place', classification: 'PLACE', resourceName: 'PLACE', displayName: 'Boendet' }],
      },
    ];
    vi.spyOn(ApiService.prototype, 'get').mockImplementation(config =>
      Promise.resolve({
        data: config.url?.endsWith('/metadata')
          ? { labels: { labelStructure: metadata } }
          : { id: 'schema-v1', name: 'avvikelse-plats-handelse', value: { type: 'object' } },
        message: 'success',
      }),
    );
    const post = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'created', stakeholders: [] }, message: 'success' });
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({
        status: 'NEW',
        parameters: [
          { key: 'eventType', values: ['AVVIKELSE'] },
          { key: 'eventConcerns', values: ['GRUPP_VERKSAMHET'] },
        ],
        jsonParameters: [parameter('avvikelse-plats-handelse', 'schema-v1', { facility: { orgName: 'Boendet' } })],
        labels: [{ id: 'forged', resourceName: 'GRANT_ACCESS' }],
      })
      .expect(200);
    const data = post.mock.calls[0]?.[0].data as { labels: { id?: string; resourceName?: string }[] };
    expect(data.labels.map(label => label.resourceName)).toEqual(['REPORT_TYPE', 'DEVIATION', 'platsstruktur', 'PLACE']);
    expect(data.labels).not.toContainEqual(expect.objectContaining({ id: 'forged' }));
  });

  it.each([
    'http://json-schema.org/draft-07/schema#',
    'https://json-schema.org/draft/2019-09/schema',
    'https://json-schema.org/draft/2020-12/schema',
  ])('validates the actual schema fixture with dialect %s', async dialect => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { ...schemaFixture, id: 'schema-v1', name: schemaName, value: { ...schemaFixture.value, $schema: dialect } },
      message: 'success',
    });
    const post = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'created', stakeholders: [] }, message: 'success' });
    const value = { facilityInfo: { orgName: 'Boendet' }, eventDate: '2026-09-07', eventDescription: 'Detta är en beskrivning' };
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter(schemaName, 'schema-v1', value)] })
      .expect(200);
    post.mockClear();
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter(schemaName, 'schema-v1', { ...value, eventDescription: '<p>kort</p>' })] })
      .expect(400);
    expect(post).not.toHaveBeenCalled();
  });

  it.each([
    { concerns: undefined, stakeholders: [] },
    { concerns: 'UNKNOWN', stakeholders: [] },
    { concerns: 'ENSKILD_BRUKARE', stakeholders: [] },
  ])('rejects invalid avvikelse parties: $concerns', async ({ concerns, stakeholders }) => {
    const configuration = runtime.loadRuntimeConfiguration();
    vi.mocked(runtime.loadRuntimeConfiguration).mockReturnValue({
      ...configuration,
      mode: 'katla',
      katlaId: 'avvikelse',
      definition: avvikelseDefinition,
      definitionRevision: definitionRevision(avvikelseDefinition),
    });
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { id: 'schema-v1', name: 'avvikelse-plats-handelse', value: { type: 'object' } },
      message: 'success',
    });
    const post = vi.spyOn(ApiService.prototype, 'post');
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({
        status: 'NEW',
        stakeholders,
        parameters: [{ key: 'eventType', values: ['AVVIKELSE'] }, ...(concerns ? [{ key: 'eventConcerns', values: [concerns] }] : [])],
        jsonParameters: [parameter('avvikelse-plats-handelse', 'schema-v1', {})],
      })
      .expect(400);
    expect(post).not.toHaveBeenCalled();
  });

  it('enforces the version-bound UI date maximum on the server', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockImplementation(config =>
      Promise.resolve({
        data: config.url?.endsWith('/ui-schema')
          ? { value: { when: { 'ui:options': { maxDate: 'today' } } } }
          : { id: 'schema-v1', name: schemaName, value: { type: 'object', properties: { when: { type: 'string', format: 'date' } } } },
        message: 'success',
      }),
    );
    const post = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'created', stakeholders: [] }, message: 'success' });
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter(schemaName, 'schema-v1', { when: '2999-01-01' })] })
      .expect(400);
    expect(post).not.toHaveBeenCalled();
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter(schemaName, 'schema-v1', { when: '2020-01-01' })] })
      .expect(200);
  });

  it('preserves non-object JSON from historical drafts without coercion', async () => {
    const saved = parameter('retired-form', 'saved-v0', ['text', 0, false, null]);
    persisted = { ...persisted, jsonParameters: [saved] };
    vi.spyOn(ApiService.prototype, 'get').mockImplementation(config =>
      Promise.resolve({
        data: config.url?.endsWith('/errands/errand-1')
          ? persisted
          : config.url?.endsWith('/ui-schema')
            ? { value: {} }
            : { id: 'saved-v0', name: 'retired-form', value: { type: 'array' } },
        message: 'success',
      }),
    );
    const patch = vi
      .spyOn(ApiService.prototype, 'patch')
      .mockResolvedValue({ data: { ...persisted, status: 'NEW', stakeholders: [] }, message: 'success' });
    await request(server())
      .patch('/api/supportmanagement/errand/save')
      .send({ id: 'errand-1', status: 'NEW', jsonParameters: [saved] })
      .expect(200);
    expect(patch.mock.calls[0]?.[0].data).toMatchObject({ jsonParameters: [saved] });
  });

  it('only acknowledges notifications owned by the authenticated reporter', async () => {
    const owned = { id: 'owned', ownerId: 'max', errandId: 'errand-1', acknowledged: false };
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: [owned], message: 'success' });
    const patch = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: undefined, message: 'success' });
    await request(server())
      .patch('/api/supportmanagement/notifications')
      .send([{ id: 'someone-elses', ownerId: 'max' }])
      .expect(404);
    expect(patch).not.toHaveBeenCalled();
    await request(server())
      .patch('/api/supportmanagement/notifications')
      .send([{ id: 'owned', ownerId: 'forged', globalAcknowledged: true }])
      .expect(200);
    expect(patch.mock.calls[0]?.[0].data).toEqual([{ ...owned, acknowledged: true }]);
  });

  it('stops safely when schema service is unavailable', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new HttpException(503, 'Schema unavailable'));
    const post = vi.spyOn(ApiService.prototype, 'post');
    await request(server())
      .post('/api/supportmanagement/errand/create')
      .send({ status: 'NEW', jsonParameters: [parameter()] })
      .expect(503);
    expect(post).not.toHaveBeenCalled();
  });
});
