import { apiService, withRequestGroup } from '@services/api-service';
import type { AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config?: AxiosRequestConfig) => Promise<{ data: unknown }>>(),
  post: vi.fn<(url: string, data: unknown, config?: AxiosRequestConfig) => Promise<{ data: unknown }>>(),
}));

vi.mock('axios', () => ({ default: axiosMocks }));

const GROUP_HEADER = 'X-Request-Group-Id';

const sentHeaders = (mock: { mock: { calls: unknown[][] } }, call: number): Record<string, unknown> => {
  const config = mock.mock.calls[call]?.at(-1) as AxiosRequestConfig | undefined;
  return config?.headers ?? {};
};

beforeEach(() => {
  vi.clearAllMocks();
  axiosMocks.get.mockResolvedValue({ data: {} });
  axiosMocks.post.mockResolvedValue({ data: {} });
});

describe('request groups', () => {
  it('lets every request in one user action carry the same group', async () => {
    await withRequestGroup(async () => {
      await apiService.post('supportmanagement/errand/1/conversations', { topic: 'Ämne' });
      await apiService.post('supportmanagement/errand/1/conversations/2/messages', new FormData(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    const groupId = sentHeaders(axiosMocks.post, 0)[GROUP_HEADER];
    expect(groupId).toEqual(expect.any(String));
    expect(sentHeaders(axiosMocks.post, 1)).toEqual({
      'Content-Type': 'multipart/form-data',
      [GROUP_HEADER]: groupId,
    });
  });

  it('lets an action started inside another join it', async () => {
    await withRequestGroup(async () => {
      await apiService.post('first', {});
      await withRequestGroup(() => apiService.post('second', {}));
    });

    expect(sentHeaders(axiosMocks.post, 1)[GROUP_HEADER]).toBe(sentHeaders(axiosMocks.post, 0)[GROUP_HEADER]);
  });

  it('gives each action its own group and sends none outside an action', async () => {
    await withRequestGroup(() => apiService.post('first', {}));
    await withRequestGroup(() => apiService.post('second', {}));
    await apiService.get('supportmanagement/notifications');

    expect(sentHeaders(axiosMocks.post, 1)[GROUP_HEADER]).not.toBe(sentHeaders(axiosMocks.post, 0)[GROUP_HEADER]);
    expect(sentHeaders(axiosMocks.get, 0)).toEqual({ 'Content-Type': 'application/json' });
  });

  it('ends the action even when it fails', async () => {
    await expect(withRequestGroup(() => Promise.reject(new Error('failed')))).rejects.toThrow('failed');
    await apiService.post('after', {});

    expect(sentHeaders(axiosMocks.post, 0)).not.toHaveProperty(GROUP_HEADER);
  });
});
