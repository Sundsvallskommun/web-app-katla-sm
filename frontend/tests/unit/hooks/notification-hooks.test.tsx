import { acknowledgeErrandNotifications, getNotifications } from '@services/notification-service/notification-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAcknowledgeErrandNotifications } from 'src/hooks/use-acknowledge-errand-notifications';
import { useNotificationPoller } from 'src/hooks/use-notification-poller';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  acknowledgeErrandNotifications: vi.fn(),
  getNotifications: vi.fn(),
  pathname: { value: '/oversikt' },
}));

vi.mock('@services/notification-service/notification-service', () => ({
  acknowledgeErrandNotifications: mocks.acknowledgeErrandNotifications,
  getNotifications: mocks.getNotifications,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname.value,
}));

const getNotificationsMock = vi.mocked(getNotifications);
const acknowledgeErrandNotificationsMock = vi.mocked(acknowledgeErrandNotifications);

const notification = {
  id: 'notification-1',
  created: '2026-10-01T08:00:00Z',
  acknowledged: false,
  errandId: 'errand-1',
  errandNumber: 'VOF-1',
  events: [],
};

const setVisibility = (visibilityState: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: visibilityState });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setVisibility('visible');
  useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
  getNotificationsMock.mockResolvedValue([notification]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('notification poller', () => {
  it('reads the notifications at once and then once a minute', async () => {
    const { result } = renderHook(() => useNotificationPoller());

    await waitFor(() => {
      expect(result.current.loadState).toBe('ready');
    });
    expect(useNotificationStore.getState().activeNotifications).toEqual([notification]);
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(getNotificationsMock).toHaveBeenCalledTimes(2);
  });

  it('pauses in a hidden tab and catches up when the tab is shown again', async () => {
    renderHook(() => useNotificationPoller());
    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      setVisibility('hidden');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);

    act(() => {
      setVisibility('visible');
    });
    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledTimes(2);
    });
  });

  it('reports a failed read without clearing the stored notifications', async () => {
    useNotificationStore.getState().setNotifications([notification]);
    getNotificationsMock.mockRejectedValue(new Error('unavailable'));

    const { result } = renderHook(() => useNotificationPoller());

    await waitFor(() => {
      expect(result.current.loadState).toBe('error');
    });
    expect(useNotificationStore.getState().activeNotifications).toEqual([notification]);
  });
});

describe('opening an errand', () => {
  it('marks the errand notifications as read once and refreshes the bell', async () => {
    acknowledgeErrandNotificationsMock.mockResolvedValue({ acknowledged: ['notification-1'], failed: [] });
    getNotificationsMock.mockResolvedValue([{ ...notification, acknowledged: true }]);

    const { rerender } = renderHook(
      ({ errandId }) => {
        useAcknowledgeErrandNotifications(errandId);
      },
      { initialProps: { errandId: undefined as string | undefined } }
    );
    expect(acknowledgeErrandNotificationsMock).not.toHaveBeenCalled();

    rerender({ errandId: 'errand-1' });
    rerender({ errandId: 'errand-1' });

    await waitFor(() => {
      expect(useNotificationStore.getState().acknowledgedNotifications).toHaveLength(1);
    });
    expect(acknowledgeErrandNotificationsMock).toHaveBeenCalledTimes(1);
    expect(acknowledgeErrandNotificationsMock).toHaveBeenCalledWith('errand-1');
  });

  it('leaves the list alone when there was nothing to mark as read', async () => {
    acknowledgeErrandNotificationsMock.mockResolvedValue({ acknowledged: [], failed: [] });

    renderHook(() => {
      useAcknowledgeErrandNotifications('errand-1');
    });

    await waitFor(() => {
      expect(acknowledgeErrandNotificationsMock).toHaveBeenCalledTimes(1);
    });
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });
});
