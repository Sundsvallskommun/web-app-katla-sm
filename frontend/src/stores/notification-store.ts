import { SupportNotificationDTO } from '@data-contracts/backend/data-contracts';
import { newestFirst } from '@utils/notifications';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationLists {
  activeNotifications: SupportNotificationDTO[];
  acknowledgedNotifications: SupportNotificationDTO[];
}

interface NotificationState extends NotificationLists {
  setNotifications: (notifications: SupportNotificationDTO[]) => void;
}

const EMPTY_NOTIFICATIONS: NotificationLists = { activeNotifications: [], acknowledgedNotifications: [] };

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      ...EMPTY_NOTIFICATIONS,
      setNotifications: (notifications) =>
        set({
          activeNotifications: newestFirst(notifications.filter((notification) => !notification.acknowledged)),
          acknowledgedNotifications: newestFirst(notifications.filter((notification) => notification.acknowledged)),
        }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ activeNotifications, acknowledgedNotifications }): NotificationLists => ({
        activeNotifications,
        acknowledgedNotifications,
      }),
      // Version 1 är en notis per ärende med händelser. En sparad lista i den gamla formen, en notis
      // per händelse, ersätts med en tom lista tills nästa hämtning.
      version: 1,
      migrate: () => EMPTY_NOTIFICATIONS,
    }
  )
);
