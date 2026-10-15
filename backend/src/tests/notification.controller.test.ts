import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementNotificationController } from '@/controllers/supportmanagement-notification.controller';
import { HttpException } from '@/exceptions/HttpException';
import ApiService, { type ApiRequestConfig } from '@/services/api.service';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', {
      configurable: true,
      value: { username: 'rapportor', firstName: 'Rapp', lastName: 'Ortor' },
    });
    next();
  },
}));

const app = new App([SupportManagementNotificationController]).getServer();

const OWN_NEW = '11111111-1111-4111-8111-111111111111';
const OWN_READ = '22222222-2222-4222-8222-222222222222';
const OTHER_ERRAND = '33333333-3333-4333-8333-333333333333';
const FOREIGN = '44444444-4444-4444-8444-444444444444';

const notification = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  created: '2026-10-01T08:00:00Z',
  errandId: 'errand-1',
  errandNumber: 'VOF-1',
  events: [],
  ...overrides,
});

const OWN_NOTIFICATIONS = [
  notification(OWN_NEW),
  notification(OWN_READ, { acknowledged: '2026-10-01T09:00:00Z' }),
  notification(OTHER_ERRAND, { errandId: 'errand-2', errandNumber: 'VOF-2' }),
];

/** Svarar med en sida i taget ur `pages`, efter sidnumret i anropet. */
const mockNotificationPages = (pages: unknown[][]) =>
  vi.spyOn(ApiService.prototype, 'get').mockImplementation((config: ApiRequestConfig) => {
    const page = (config.params as { page?: number } | undefined)?.page ?? 0;
    return Promise.resolve({ data: { content: pages[page] ?? [], totalPages: pages.length }, message: 'success' });
  });

const acknowledgedUrls = (putSpy: { mock: { calls: [ApiRequestConfig, ...unknown[]][] } }): string[] =>
  putSpy.mock.calls.map(([config]) => config.url ?? '');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notifications', () => {
  it('läser alla sidor och lämnar en notis per ärende, med den senaste händelsen först', async () => {
    const withEvents = notification(OWN_NEW, {
      events: [
        { created: '2026-10-01T08:00:00Z', eventType: 'CREATE', subType: 'MESSAGE', description: 'Meddelande mottaget' },
        { created: '2026-10-01T10:00:00Z', eventType: 'CREATE', subType: 'ATTACHMENT', description: 'Bilaga har skapats' },
      ],
    });
    const getSpy = mockNotificationPages([[withEvents], [withEvents, notification(OTHER_ERRAND)]]);

    const response = await request(app).get('/api/supportmanagement/notifications').expect(200);

    expect(response.body).toEqual([
      {
        id: OWN_NEW,
        created: '2026-10-01T08:00:00Z',
        acknowledged: false,
        errandId: 'errand-1',
        errandNumber: 'VOF-1',
        events: [
          { created: '2026-10-01T10:00:00Z', eventType: 'CREATE', subType: 'ATTACHMENT', description: 'Bilaga har skapats' },
          { created: '2026-10-01T08:00:00Z', eventType: 'CREATE', subType: 'MESSAGE', description: 'Meddelande mottaget' },
        ],
      },
      expect.objectContaining({ id: OTHER_ERRAND }),
    ]);
    expect(getSpy).toHaveBeenCalledTimes(2);
    const [config] = getSpy.mock.calls[0] ?? [];
    expect(config?.url).toBe('supportmanagement-sprint/17.0/2281/test/notifications/adAccount/rapportor');
    expect(config?.params).toEqual({ page: 0, size: 100, sort: 'created,desc' });
  });

  it('jämför händelsetyperna i versaler och ger en händelse utan tid notisens tid', async () => {
    mockNotificationPages([[notification(OWN_NEW, { events: [{ eventType: 'update', subType: 'message' }] })]]);

    const response = await request(app).get('/api/supportmanagement/notifications').expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({ events: [{ created: '2026-10-01T08:00:00Z', eventType: 'UPDATE', subType: 'MESSAGE' }] }),
    ]);
  });

  it('visar en kvitterad notis som läst', async () => {
    mockNotificationPages([[notification(OWN_READ, { acknowledged: '2026-10-01T09:00:00Z' })]]);

    const response = await request(app).get('/api/supportmanagement/notifications').expect(200);

    expect(response.body).toEqual([expect.objectContaining({ id: OWN_READ, acknowledged: true })]);
  });

  it('hoppar över en notis som inte går att länka till ett ärende', async () => {
    mockNotificationPages([[notification(OWN_NEW, { errandNumber: undefined }), notification(OTHER_ERRAND)]]);

    const response = await request(app).get('/api/supportmanagement/notifications').expect(200);

    expect(response.body).toEqual([expect.objectContaining({ id: OTHER_ERRAND })]);
  });

  it('svarar 502 när SupportManagement inte svarar med en sida', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: [], message: 'success' });

    const response = await request(app).get('/api/supportmanagement/notifications').expect(502);

    expect(response.body).toEqual({ message: 'Invalid response when reading notifications' });
  });

  it('släpper igenom ett uppströmsfel', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new HttpException(503, 'Upstream unavailable'));

    const response = await request(app).get('/api/supportmanagement/notifications').expect(503);

    expect(response.body).toEqual({ message: 'Upstream unavailable' });
  });
});

describe('acknowledging notifications', () => {
  it('kvitterar bara användarens egna notiser, och gör det tyst', async () => {
    mockNotificationPages([OWN_NOTIFICATIONS]);
    const putSpy = vi.spyOn(ApiService.prototype, 'put').mockResolvedValue({ data: undefined, message: 'success' });

    const response = await request(app)
      .patch('/api/supportmanagement/notifications/acknowledge')
      .send({ ids: [OWN_NEW, OWN_READ, FOREIGN] })
      .expect(200);

    expect(response.body).toEqual({ acknowledged: [OWN_READ, OWN_NEW], failed: [FOREIGN] });
    expect(acknowledgedUrls(putSpy)).toEqual([`supportmanagement-sprint/17.0/2281/test/notifications/${OWN_NEW}/acknowledge`]);
    expect(putSpy).toHaveBeenCalledWith(expect.objectContaining({ notifySubscribers: false }), expect.anything());
  });

  it('redovisar en kvittens som misslyckas utan att de andra räknas som misslyckade', async () => {
    mockNotificationPages([OWN_NOTIFICATIONS]);
    vi.spyOn(ApiService.prototype, 'put').mockImplementation((config: ApiRequestConfig) =>
      config.url?.includes(OTHER_ERRAND)
        ? Promise.reject(new HttpException(500, 'Internal server error from gateway'))
        : Promise.resolve({ data: undefined, message: 'success' }),
    );

    const response = await request(app)
      .patch('/api/supportmanagement/notifications/acknowledge')
      .send({ ids: [OWN_NEW, OTHER_ERRAND] })
      .expect(200);

    expect(response.body).toEqual({ acknowledged: [OWN_NEW], failed: [OTHER_ERRAND] });
  });

  it.each([{ ids: [] }, { ids: ['../errands/errand-1'] }, {}])('avvisar en begäran utan giltiga id:n', async body => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get');
    const putSpy = vi.spyOn(ApiService.prototype, 'put');

    await request(app).patch('/api/supportmanagement/notifications/acknowledge').send(body).expect(400);

    expect(getSpy).not.toHaveBeenCalled();
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('kvitterar ärendets okvitterade notiser när ärendet öppnas', async () => {
    mockNotificationPages([OWN_NOTIFICATIONS]);
    const putSpy = vi.spyOn(ApiService.prototype, 'put').mockResolvedValue({ data: undefined, message: 'success' });

    const response = await request(app).put('/api/supportmanagement/errand/errand-1/notifications/acknowledge').expect(200);

    expect(response.body).toEqual({ acknowledged: [OWN_NEW], failed: [] });
    expect(acknowledgedUrls(putSpy)).toEqual([`supportmanagement-sprint/17.0/2281/test/notifications/${OWN_NEW}/acknowledge`]);
    expect(putSpy).toHaveBeenCalledWith(expect.objectContaining({ notifySubscribers: false }), expect.anything());
  });

  it('skriver ingenting när ärendet saknar okvitterade notiser', async () => {
    mockNotificationPages([OWN_NOTIFICATIONS]);
    const putSpy = vi.spyOn(ApiService.prototype, 'put');

    const response = await request(app).put('/api/supportmanagement/errand/errand-3/notifications/acknowledge').expect(200);

    expect(response.body).toEqual({ acknowledged: [], failed: [] });
    expect(putSpy).not.toHaveBeenCalled();
  });
});
