import type { AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApiService from '@/services/api.service';
import ApiTokenService from '@/services/api-token.service';
import { requestGroupIdFor, resolveRequestGroupId } from '@/utils/request-group';

const axiosMocks = vi.hoisted(() => ({
  isAxiosError: vi.fn<(error: unknown) => boolean>(),
  request: vi.fn<(config: AxiosRequestConfig) => Promise<{ data: unknown; headers: Record<string, unknown> }>>(),
}));

vi.mock('axios', () => ({
  default: Object.assign(axiosMocks.request, {
    isAxiosError: axiosMocks.isAxiosError,
  }),
}));

const GROUP_ID = '0b9f6c3e-5d2a-4c1b-9e8f-7a6b5c4d3e2f';
const SUPPORTMANAGEMENT_URL = 'supportmanagement-sprint/17.0/2281/test/errands/errand-1';
const EMPLOYEE_URL = 'employee/2.0/2281/portalpersondata/personal/rapportor';

const browserRequest = (headers: Record<string, string> = {}) => ({ headers, session: { user: { username: 'rapportor' } } });

const sentHeaders = (call = 0): Record<string, unknown> => {
  const [config] = axiosMocks.request.mock.calls[call] ?? [];
  return config?.headers ?? {};
};

describe('request groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMocks.isAxiosError.mockReturnValue(false);
    axiosMocks.request.mockResolvedValue({ data: { ok: true }, headers: {} });
    vi.spyOn(ApiTokenService.prototype, 'getToken').mockResolvedValue('token');
  });

  it('behåller det id webbläsaren skickade för sin handling', () => {
    expect(resolveRequestGroupId(GROUP_ID)).toBe(GROUP_ID);
  });

  it('ger en request ett eget id när webbläsaren inte skickade något giltigt', () => {
    const generated = resolveRequestGroupId('inte-ett-uuid');

    expect(generated).not.toBe('inte-ett-uuid');
    expect(resolveRequestGroupId(generated)).toBe(generated);
  });

  it('låter alla anrop under samma request dela grupp', () => {
    const req = browserRequest();

    expect(requestGroupIdFor(req)).toBe(requestGroupIdFor(req));
    expect(requestGroupIdFor(req)).not.toBe(requestGroupIdFor(browserRequest()));
  });

  it('skickar handlingens grupp till SupportManagement', async () => {
    await new ApiService().patch({ url: SUPPORTMANAGEMENT_URL }, browserRequest({ 'x-request-group-id': GROUP_ID }));

    expect(sentHeaders()['X-Request-Group-Id']).toBe(GROUP_ID);
  });

  it('skickar samma grupp i varje anrop som görs för en request', async () => {
    const req = browserRequest();
    const service = new ApiService();

    await service.patch({ url: SUPPORTMANAGEMENT_URL }, req);
    await service.post({ url: `${SUPPORTMANAGEMENT_URL}/notes` }, req);

    expect(sentHeaders(0)['X-Request-Group-Id']).toEqual(expect.any(String));
    expect(sentHeaders(1)['X-Request-Group-Id']).toBe(sentHeaders(0)['X-Request-Group-Id']);
  });

  it('skickar ingen grupp till andra tjänster än SupportManagement', async () => {
    await new ApiService().get({ url: EMPLOYEE_URL }, browserRequest({ 'x-request-group-id': GROUP_ID }));

    expect(sentHeaders()).not.toHaveProperty('X-Request-Group-Id');
  });

  it('gör en skrivning tyst bara när anroparen ber om det', async () => {
    const service = new ApiService();

    await service.post({ url: SUPPORTMANAGEMENT_URL }, browserRequest());
    await service.post({ url: SUPPORTMANAGEMENT_URL, notifySubscribers: false }, browserRequest());

    expect(sentHeaders(0)).not.toHaveProperty('X-notify');
    expect(sentHeaders(1)['X-notify']).toBe('false');
  });
});
