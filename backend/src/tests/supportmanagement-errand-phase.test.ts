import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { MetadataResponse } from '@/data-contracts/supportmanagement/data-contracts';
import ApiService from '@/services/api.service';

import { errandLabelMetadata, validErrandLabels } from './fixtures/errand-labels';

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

const sentData = (path: string): unknown => (path.endsWith('/create') ? postMock : patchMock).mock.calls[0]?.[0].data;

const respondWithMetadata = (metadata: MetadataResponse) => {
  getMock.mockResolvedValue({ data: structuredClone(metadata), message: 'success' });
};

beforeEach(() => {
  getMock.mockReset();
  respondWithMetadata(errandLabelMetadata);
  postMock.mockReset().mockResolvedValue({ data: { id: 'errand-id', stakeholders: [] }, message: 'success' });
  patchMock.mockReset().mockResolvedValue({ data: { id: 'errand-id', stakeholders: [] }, message: 'success' });
  vi.spyOn(ApiService.prototype, 'get').mockImplementation(getMock);
  vi.spyOn(ApiService.prototype, 'post').mockImplementation(postMock);
  vi.spyOn(ApiService.prototype, 'patch').mockImplementation(patchMock);
});

afterEach(() => vi.restoreAllMocks());

describe.each(paths)('Errand phase at %s', path => {
  it.each([
    ['DRAFT', 'phase-registration'],
    ['NEW', 'phase-investigation'],
  ])('sends the phase that metadata maps to status %s', async (status, expected) => {
    await write(path, { status, labels: validErrandLabels }).expect(200);

    expect(sentData(path)).toMatchObject({ status, activePhaseId: expected });
  });

  it('overrides a phase supplied by the client', async () => {
    await write(path, { status: 'NEW', labels: validErrandLabels, activePhaseId: 'phase-closure' }).expect(200);

    expect(sentData(path)).toMatchObject({ activePhaseId: 'phase-investigation' });
  });

  // Ett odefinierat värde faller bort ur den JSON som skickas, och fasen uppströms lämnas orörd.
  it('leaves the phase unset when metadata maps no phase to the status', async () => {
    await write(path, { status: 'UNKNOWN_STATUS', labels: validErrandLabels, activePhaseId: 'phase-closure' }).expect(200);

    expect(sentData(path)).toMatchObject({ activePhaseId: undefined });
  });

  it('leaves the phase unset when the namespace has no phases', async () => {
    respondWithMetadata({ ...errandLabelMetadata, phases: [] });
    await write(path, { status: 'NEW', labels: validErrandLabels }).expect(200);

    expect(sentData(path)).toMatchObject({ activePhaseId: undefined });
  });

  it('does not write back the phase history, which upstream owns', async () => {
    const phases = [{ phaseId: 'phase-registration', name: 'REGISTRATION', started: '2026-01-01T00:00:00.000+01:00' }];
    await write(path, { status: 'NEW', labels: validErrandLabels, phases }).expect(200);

    expect(sentData(path)).not.toHaveProperty('phases');
  });
});
