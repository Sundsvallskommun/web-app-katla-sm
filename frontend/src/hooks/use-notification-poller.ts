'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useRefreshNotifications } from './use-refresh-notifications';

const POLL_INTERVAL_MS = 60_000;

export type NotificationLoadState = 'loading' | 'ready' | 'error';

/**
 * Håller notislistan aktuell medan användaren är kvar på en sida, så att klockan visar nya notiser
 * utan att panelen behöver öppnas. Hämtningen pausar i en dold flik och sker direkt när fliken syns
 * igen, och ett byte av vy hämtar också direkt. Används en gång per sida, där notispanelen finns.
 */
export const useNotificationPoller = (): { loadState: NotificationLoadState; refresh: () => Promise<void> } => {
  const refreshNotifications = useRefreshNotifications();
  const pathname = usePathname();
  const [loadState, setLoadState] = useState<NotificationLoadState>('loading');

  const refresh = useCallback(async () => {
    try {
      await refreshNotifications();
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [refreshNotifications]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      timer ??= setInterval(() => {
        void refresh();
      }, POLL_INTERVAL_MS);
    };

    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        start();
      } else {
        stop();
      }
    };

    void refresh();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Vyn är ett beroende med avsikt: en ny vy hämtar listan direkt i stället för vid nästa intervall.
  }, [refresh, pathname]);

  return { loadState, refresh };
};
