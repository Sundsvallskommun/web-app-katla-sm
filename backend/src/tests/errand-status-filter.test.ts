import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import ApiService from '@/services/api.service';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', { configurable: true, value: { username: 'test-user' } });
    next();
  },
}));

const app = new App([SupportManagementController]).getServer();

afterEach(() => {
  vi.restoreAllMocks();
});

interface ApiGetSpy {
  mock: { calls: unknown[][] };
}

/** Adressen skickas procentkodad; testerna jämför mot den så som upstream läser den. */
const requestedUrl = (getSpy: ApiGetSpy): string => {
  const [firstCall] = getSpy.mock.calls;
  const [requestConfig] = firstCall ?? [];
  const { url } = (requestConfig ?? {}) as { url?: string };

  return decodeURIComponent(url ?? '');
};

const requestedFilter = (getSpy: ApiGetSpy): string | undefined => requestedUrl(getSpy).split('filter=')[1];

/**
 * Inskickade är alla statusar utom de avslutade, så listan måste kunna hämtas som en sida. Flera
 * statusar skickas kommaseparerade — upprepade parametrar slås ihop av hpp — och blir en or-grupp
 * i stället för ett villkor som inget ärende kan uppfylla.
 */
describe('errand status filter', () => {
  it('filters on a single status without a group', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    await request(app).get('/api/supportmanagement/errands').query({ status: 'SOLVED' }).expect(200);

    expect(requestedFilter(getSpy)).toBe("status:'SOLVED'");
  });

  it('joins several statuses with or', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    await request(app).get('/api/supportmanagement/errands').query({ status: 'NEW,ONGOING,PENDING' }).expect(200);

    expect(requestedFilter(getSpy)).toBe("(status:'NEW' or status:'ONGOING' or status:'PENDING')");
  });

  it('counts the same set of statuses as the list', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { count: 4 }, message: 'success' });

    await request(app).get('/api/supportmanagement/count').query({ status: 'NEW,ONGOING' }).expect(200);

    expect(requestedFilter(getSpy)).toBe("(status:'NEW' or status:'ONGOING')");
  });

  it('keeps paging and sorting out of the filter expression', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    await request(app).get('/api/supportmanagement/errands').query({ status: 'NEW', page: 2, size: 12, sort: 'created,desc' }).expect(200);

    const url = requestedUrl(getSpy);

    expect(requestedFilter(getSpy)).toBe("status:'NEW'");
    expect(url).toContain('page=2');
    expect(url).toContain('size=12');
    expect(url).toContain('sort=created,desc');
  });

  it('sends no filter at all when no status is given', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: { content: [] }, message: 'success' });

    await request(app).get('/api/supportmanagement/errands').expect(200);

    expect(requestedFilter(getSpy)).toBeUndefined();
  });

  it('rejects a status value that would break out of the filter literal', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get');

    const response = await request(app).get('/api/supportmanagement/errands').query({ status: "NEW' or status:'SOLVED" }).expect(400);

    expect(response.body).toEqual({ message: 'Invalid filter value' });
    expect(getSpy).not.toHaveBeenCalled();
  });
});
