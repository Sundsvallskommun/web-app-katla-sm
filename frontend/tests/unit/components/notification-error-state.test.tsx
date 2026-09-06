import { LayerProvider } from '@astryxdesign/core/Layer';
import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationItem } from 'src/components/notifications/notification-item';
import { NotificationsWrapper } from 'src/components/notifications/notification-wrapper';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  acknowledgeNotification: vi.fn(),
  getNotifications: vi.fn(),
  translate: (key: string) => key,
}));

vi.mock('@services/errand-service/errand-service', () => ({
  acknowledgeNotification: mocks.acknowledgeNotification,
  getNotifications: mocks.getNotifications,
}));

vi.mock('src/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.translate }),
}));

const acknowledgeNotificationMock = vi.mocked(acknowledgeNotification);
const getNotificationsMock = vi.mocked(getNotifications);

const activeNotification: NotificationDTO = {
  id: 'notification-id',
  acknowledged: false,
  created: '2026-08-12T08:00:00Z',
  description: 'Ärende uppdaterat',
  errandNumber: 'ERRAND-1',
};

beforeEach(() => {
  useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('notification API error state', () => {
  it('names the modal panel and places initial focus on its close button', async () => {
    getNotificationsMock.mockResolvedValue([]);

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    const panel = await screen.findByRole('dialog', { name: 'layout:notifications.panel' });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'layout:notifications.close' })).toHaveFocus();
    });
  });

  it('keeps stored notifications visible and does not render a false empty state', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    getNotificationsMock.mockRejectedValue(new Error('notifications unavailable'));

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('api_errors.notifications');
    });
    expect(screen.getByText('ERRAND-1')).toBeInTheDocument();
    expect(screen.queryByText('Inga nya notifieringar')).not.toBeInTheDocument();
    expect(screen.queryByText('Inga notifieringar')).not.toBeInTheDocument();
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('handles a failed refresh after acknowledgement without clearing notifications', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    acknowledgeNotificationMock.mockResolvedValue(true);
    getNotificationsMock.mockRejectedValue(new Error('refresh unavailable'));

    render(
      <LayerProvider>
        <NotificationItem notification={activeNotification} />
      </LayerProvider>
    );
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('api_errors.notifications');
    });
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('reports an acknowledgement failure without attempting a refresh', async () => {
    acknowledgeNotificationMock.mockRejectedValue(new Error('acknowledgement unavailable'));

    render(
      <LayerProvider>
        <NotificationItem notification={activeNotification} />
      </LayerProvider>
    );
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('api_errors.acknowledge_notification');
    });
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });
});
