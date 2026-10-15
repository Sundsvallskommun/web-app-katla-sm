import { SupportNotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotifications, getNotifications } from '@services/notification-service/notification-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationItem } from 'src/components/notifications/notification-item';
import { NotificationsWrapper } from 'src/components/notifications/notification-wrapper';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  acknowledgeNotifications: vi.fn(),
  getNotifications: vi.fn(),
  snackbar: vi.fn(),
}));

vi.mock('@services/notification-service/notification-service', () => ({
  acknowledgeNotifications: mocks.acknowledgeNotifications,
  getNotifications: mocks.getNotifications,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/oversikt',
}));

vi.mock('src/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count === undefined ? key : `${key}:${String(options.count)}`,
  }),
}));

// jsdom saknar showModal/close. Browserfallen testar den riktiga modal-livscykeln;
// dessa tester gäller notifieringarnas namn, data och felpresentation.
vi.mock('@components/modal-layer/modal-layer.component', () => ({
  ModalLayer: ({ show, label, children }: { show: boolean; label: string; children: ReactNode }) => (
    <dialog open={show} aria-label={label} aria-modal="true">
      {children}
    </dialog>
  ),
}));

vi.mock('@sk-web-gui/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sk-web-gui/react')>();
  return { ...original, useSnackbar: () => mocks.snackbar };
});

const acknowledgeNotificationsMock = vi.mocked(acknowledgeNotifications);
const getNotificationsMock = vi.mocked(getNotifications);

const notification = (id: string, errandNumber: string, events: SupportNotificationDTO['events'] = []) => ({
  id,
  acknowledged: false,
  created: '2026-08-12T08:00:00Z',
  errandId: `errand-${id}`,
  errandNumber,
  events,
});

const activeNotification: SupportNotificationDTO = notification('notification-id', 'ERRAND-1', [
  { created: '2026-08-12T08:00:00Z', eventType: 'UPDATE', subType: 'ERRAND', description: 'Ärende uppdaterat' },
]);

beforeEach(() => {
  useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('notification API error state', () => {
  it('names the modal panel and its close button', async () => {
    getNotificationsMock.mockResolvedValue([]);

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    const panel = await screen.findByRole('dialog', { name: 'layout:notifications.panel' });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'layout:notifications.close' })).toBeEnabled();
  });

  it('keeps stored notifications visible and does not render a false empty state', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    getNotificationsMock.mockRejectedValue(new Error('notifications unavailable'));

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('api_errors.notifications');
    expect(screen.getByText('ERRAND-1')).toBeInTheDocument();
    expect(screen.queryByText('layout:notifications.none_new')).not.toBeInTheDocument();
    expect(screen.queryByText('layout:notifications.none_previous')).not.toBeInTheDocument();
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('handles a failed refresh after acknowledgement without clearing notifications', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    acknowledgeNotificationsMock.mockResolvedValue({ acknowledged: ['notification-id'], failed: [] });
    getNotificationsMock.mockRejectedValue(new Error('refresh unavailable'));

    render(<NotificationItem notification={activeNotification} />);
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(mocks.snackbar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'api_errors.notifications', status: 'error' })
      );
    });
    expect(acknowledgeNotificationsMock).toHaveBeenCalledWith(['notification-id']);
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('reports an acknowledgement failure without attempting a refresh', async () => {
    acknowledgeNotificationsMock.mockRejectedValue(new Error('acknowledgement unavailable'));

    render(<NotificationItem notification={activeNotification} />);
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(mocks.snackbar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'api_errors.acknowledge_notifications:1', status: 'error' })
      );
    });
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });

  it('does not acknowledge a notification that is already read', () => {
    render(<NotificationItem notification={{ ...activeNotification, acknowledged: true }} />);
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    expect(acknowledgeNotificationsMock).not.toHaveBeenCalled();
  });
});

describe('notification panel', () => {
  it('collapses several events on one errand into one row that can be expanded', () => {
    const grouped = notification('grouped', 'ERRAND-2', [
      { created: '2026-08-12T09:00:00Z', subType: 'MESSAGE', description: 'Meddelande mottaget' },
      { created: '2026-08-12T08:00:00Z', subType: 'ATTACHMENT', description: 'Bilaga har skapats' },
    ]);

    render(<NotificationItem notification={grouped} />);

    expect(screen.getByText(/notification\.summary\.mixed/)).toBeInTheDocument();
    expect(screen.queryByText('Bilaga har skapats')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'layout:notifications.show_events:2' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'layout:notifications.hide_events' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Meddelande mottaget')).toBeInTheDocument();
    expect(screen.getByText('Bilaga har skapats')).toBeInTheDocument();
  });

  it('marks the selected new notifications as read and keeps the failed ones selected', async () => {
    const first = notification('first', 'ERRAND-1');
    const second = notification('second', 'ERRAND-2');
    useNotificationStore.getState().setNotifications([first, second]);
    getNotificationsMock.mockResolvedValue([first, second]);
    acknowledgeNotificationsMock.mockResolvedValue({ acknowledged: ['first'], failed: ['second'] });

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'layout:notifications.select_all_new' }));
    fireEvent.click(screen.getByRole('button', { name: 'layout:notifications.mark_as_read:2' }));

    await waitFor(() => {
      expect(acknowledgeNotificationsMock).toHaveBeenCalledWith(['first', 'second']);
    });
    await waitFor(() => {
      expect(mocks.snackbar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'layout:notifications.marked_as_read:1', status: 'success' })
      );
    });
    expect(mocks.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'api_errors.acknowledge_notifications:1', status: 'error' })
    );
    expect(screen.getByRole('button', { name: 'layout:notifications.mark_as_read:1' })).toBeInTheDocument();
  });

  it('offers no selection for notifications that are already read', async () => {
    getNotificationsMock.mockResolvedValue([{ ...notification('read', 'ERRAND-3'), acknowledged: true }]);

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    expect(await screen.findByText('ERRAND-3')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
