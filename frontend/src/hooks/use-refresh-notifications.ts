'use client';

import { getNotifications } from '@services/notification-service/notification-service';
import { useCallback } from 'react';
import { useNotificationStore } from 'src/stores/notification-store';

/**
 * Hämtar notislistan till storen en gång. Används efter något som ändrar vad användaren ska se, som en
 * kvittens, så att klockan visar rätt antal direkt i stället för vid nästa hämtning. Ett fel kastas
 * vidare till anroparen, som avgör om det ska visas.
 */
export const useRefreshNotifications = (): (() => Promise<void>) => {
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  return useCallback(async () => {
    setNotifications(await getNotifications());
  }, [setNotifications]);
};
