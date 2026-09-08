import { ApiResponse, apiService } from '@services/api-service';
import {
  AppContextMismatchError,
  getApplications,
  isApplicationUrl,
  verifyApplicationContext,
} from '@services/application-service';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/api-service', () => ({ apiService: { get: vi.fn() } }));
const get = vi.mocked(apiService.get);
const response = (data: unknown): AxiosResponse<ApiResponse> => ({
  data: { data, message: 'success' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: new AxiosHeaders() },
});
beforeEach(() => vi.clearAllMocks());

describe('application identity', () => {
  it('accepts matching catalogue and Katla deployments', async () => {
    get.mockResolvedValueOnce(response({ mode: 'catalogue' }));
    await expect(verifyApplicationContext({ mode: 'catalogue' })).resolves.toBeUndefined();
    const context = { mode: 'katla' as const, katlaId: 'avvikelse', definitionRevision: 'v1' };
    get.mockResolvedValueOnce(response(context));
    await expect(verifyApplicationContext(context)).resolves.toBeUndefined();
  });

  it.each([
    { mode: 'catalogue' },
    { mode: 'katla', katlaId: 'other', definitionRevision: 'v1' },
    { mode: 'katla', katlaId: 'avvikelse', definitionRevision: 'v2' },
    { mode: 'katla', katlaId: 'avvikelse' },
    null,
  ])('rejects a mismatched or incomplete deployment: %j', async (context) => {
    get.mockResolvedValue(response(context));
    await expect(
      verifyApplicationContext({ mode: 'katla', katlaId: 'avvikelse', definitionRevision: 'v1' })
    ).rejects.toBeInstanceOf(AppContextMismatchError);
  });
});

describe('application catalogue contract', () => {
  it('accepts a valid empty list and server-provided applications', async () => {
    get.mockResolvedValueOnce(response([]));
    await expect(getApplications()).resolves.toEqual([]);
    const application = { id: 'avvikelse', applicationName: 'Avvikelse', url: 'https://katla.example/avvikelse' };
    get.mockResolvedValueOnce(response([application]));
    await expect(getApplications()).resolves.toEqual([application]);
  });

  it.each([
    null,
    {},
    [{ id: 'a', applicationName: 'A', url: 'javascript:alert(1)' }],
    [{ id: 'a', applicationName: '', url: 'https://example.org' }],
    [
      { id: 'a', applicationName: 'A', url: 'https://example.org' },
      { id: 'a', applicationName: 'A', url: 'https://example.org' },
    ],
  ])('reports malformed catalogue data as a failure, never as an empty list: %j', async (data) => {
    get.mockResolvedValueOnce(response(data));
    await expect(getApplications()).rejects.toThrow();
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', '//example.org', '/katla', 'https://user:secret@example.org'])(
    'rejects unsafe links: %s',
    (url) => {
      expect(isApplicationUrl(url)).toBe(false);
    }
  );
});
