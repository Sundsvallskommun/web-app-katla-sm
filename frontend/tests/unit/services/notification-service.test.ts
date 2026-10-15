import {
  acknowledgeErrandNotifications,
  acknowledgeNotifications,
  getNotifications,
} from '@services/notification-service/notification-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@services/api-service', () => ({
  apiService: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Notification service contracts', () => {
  it('reads the notifications of the signed-in user', async () => {
    apiMocks.get.mockResolvedValue({ data: [] });

    await expect(getNotifications()).resolves.toEqual([]);
    expect(apiMocks.get).toHaveBeenCalledWith('supportmanagement/notifications');
  });

  it('marks several notifications as read in one request', async () => {
    apiMocks.patch.mockResolvedValue({ data: { acknowledged: ['a'], failed: ['b'] } });

    await expect(acknowledgeNotifications(['a', 'b'])).resolves.toEqual({ acknowledged: ['a'], failed: ['b'] });
    expect(apiMocks.patch).toHaveBeenCalledWith('supportmanagement/notifications/acknowledge', { ids: ['a', 'b'] });
  });

  it('makes no request when nothing is selected', async () => {
    await expect(acknowledgeNotifications([])).resolves.toEqual({ acknowledged: [], failed: [] });
    expect(apiMocks.patch).not.toHaveBeenCalled();
  });

  it('rejects when marking as read fails upstream', async () => {
    const error = new Error('Acknowledge failed');
    apiMocks.patch.mockRejectedValue(error);

    await expect(acknowledgeNotifications(['a'])).rejects.toBe(error);
  });

  it('marks everything on an errand as read', async () => {
    apiMocks.put.mockResolvedValue({ data: { acknowledged: ['a'], failed: [] } });

    await acknowledgeErrandNotifications('errand/1');

    expect(apiMocks.put).toHaveBeenCalledWith('supportmanagement/errand/errand%2F1/notifications/acknowledge', {});
  });
});
