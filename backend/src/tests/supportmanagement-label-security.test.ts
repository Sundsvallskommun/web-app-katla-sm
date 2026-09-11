import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { HttpException } from '@/exceptions/HttpException';
import ApiService from '@/services/api.service';

import { errandLabelMetadata, locationLabels, siblingLabel, validErrandLabels } from './fixtures/errand-labels';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', { value: { username: 'test-user' } });
    next();
  },
}));

const app = new App([SupportManagementController]).getServer();
const getMock = vi.fn<ApiService['get']>();
const postMock = vi.fn<ApiService['post']>();
const patchMock = vi.fn<ApiService['patch']>();
const paths = ['/api/supportmanagement/errand/create', '/api/supportmanagement/errand/save', '/api/supportmanagement/errand/errand-id'];
const write = (path: string, body: object) =>
  path.endsWith('/create')
    ? request(app).post(path).send(body)
    : request(app)
        .patch(path)
        .send({ id: 'errand-id', ...body });

beforeEach(() => {
  getMock.mockReset().mockResolvedValue({ data: structuredClone(errandLabelMetadata), message: 'success' });
  postMock.mockReset().mockResolvedValue({ data: { id: 'errand-id', stakeholders: [] }, message: 'success' });
  patchMock.mockReset().mockResolvedValue({ data: { id: 'errand-id', stakeholders: [] }, message: 'success' });
  vi.spyOn(ApiService.prototype, 'get').mockImplementation(getMock);
  vi.spyOn(ApiService.prototype, 'post').mockImplementation(postMock);
  vi.spyOn(ApiService.prototype, 'patch').mockImplementation(patchMock);
});

afterEach(() => vi.restoreAllMocks());

describe.each(paths)('Location security at %s', path => {
  it.each(['NEW', 'DRAFT', undefined])('rejects missing labels for status %s without writing upstream', async status => {
    await write(path, { status }).expect(400);
    expect(postMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });

  const invalidCases: [string, unknown][] = [
    ['null', null],
    ['empty list', []],
    ['object instead of list', { resourceName: 'LOCATION' }],
    ['null label', [null]],
    ['empty label', [{}]],
    ['only report type', validErrandLabels.slice(0, 2)],
    ['only root', locationLabels.slice(0, 1)],
    ['only leaf', locationLabels.slice(2)],
    ['no root', locationLabels.slice(1)],
    ['missing intermediate unit', [locationLabels[0], locationLabels[2]]],
    ['unfinished unit', locationLabels.slice(0, 2)],
    ['unknown path', [...locationLabels.slice(0, 2), { ...locationLabels[2], resourcePath: 'LOCATION/UNKNOWN' }]],
    ['forged id', [...locationLabels.slice(0, 2), { ...locationLabels[2], id: 'forged' }]],
    ['forged classification', [...locationLabels.slice(0, 2), { ...locationLabels[2], classification: 'report-type' }]],
    ['forged resource name', [...locationLabels.slice(0, 2), { ...locationLabels[2], resourceName: 'YELLOW' }]],
    ['duplicate label', [...locationLabels, locationLabels[2]]],
    ['two locations', [...locationLabels, siblingLabel]],
    ['unknown extra label', [...locationLabels, { resourcePath: 'UNKNOWN', classification: 'report-type' }]],
    ['names without stable identity', locationLabels.map(label => ({ resourceName: label.resourceName }))],
  ];

  it.each(invalidCases)('rejects %s without writing upstream', async (_name, labels) => {
    await write(path, { status: 'DRAFT', labels }).expect(400);
    expect(postMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it.each(['NEW', 'DRAFT', undefined])('sends verified metadata labels for status %s', async status => {
    const labels = validErrandLabels.map(label => ({ ...label, displayName: 'Client-supplied name', labels: [{ resourceName: 'INJECTED' }] }));
    await write(path, { status, labels }).expect(200);

    const mutation = path.endsWith('/create') ? postMock : patchMock;
    const sentData: unknown = mutation.mock.calls[0]?.[0].data;
    expect(sentData).toMatchObject({ labels: validErrandLabels });
    expect(getMock.mock.calls[0]?.[0].url).toContain('/metadata');
  });

  it('fails closed when metadata is unavailable', async () => {
    getMock.mockRejectedValue(new HttpException(503, 'Metadata unavailable'));
    await write(path, { status: 'NEW', labels: validErrandLabels }).expect(503);
    expect(postMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['empty response', undefined],
    ['missing structure', {}],
    ['empty structure', { labels: { labelStructure: [] } }],
    ['missing location root', { labels: { labelStructure: [siblingLabel] } }],
    ['malformed node', { labels: { labelStructure: [null] } }],
    ['duplicate identity', { labels: { labelStructure: [locationLabels[0], locationLabels[0]] } }],
  ])('fails closed for %s in metadata', async (_name, metadata) => {
    getMock.mockResolvedValue({ data: metadata, message: 'success' });
    await write(path, { labels: validErrandLabels }).expect(502);
    expect(postMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('rechecks metadata on every write and blocks a newly deprecated branch', async () => {
    await write(path, { status: 'DRAFT', labels: validErrandLabels }).expect(200);
    postMock.mockClear();
    patchMock.mockClear();

    const metadata = structuredClone(errandLabelMetadata);
    const root = metadata.labels?.labelStructure?.[0];
    if (!root) throw new Error('Expected location root');
    root.deprecated = true;
    getMock.mockResolvedValue({ data: metadata, message: 'success' });

    await write(path, { status: 'NEW', labels: validErrandLabels }).expect(400);
    expect(postMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });
});
