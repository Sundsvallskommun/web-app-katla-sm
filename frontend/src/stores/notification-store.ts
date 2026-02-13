import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface  NotificationState {
  activeNotifications: NotificationDTO[];
  acknowledgedNotifications: NotificationDTO[];
  setActiveNotifications: (notification: NotificationDTO[]) => void;
  setAcknowledgedNotifications: (notification: NotificationDTO[]) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      activeNotifications: [],
      acknowledgedNotifications: [],
      setActiveNotifications: (count) => set({ activeNotifications: count }),
      setAcknowledgedNotifications: (count) => set({ acknowledgedNotifications: count }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);