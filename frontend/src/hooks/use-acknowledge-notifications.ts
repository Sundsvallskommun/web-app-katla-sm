'use client';

import { acknowledgeNotifications } from '@services/notification-service/notification-service';
import { useSnackbar } from '@sk-web-gui/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRefreshNotifications } from './use-refresh-notifications';

/**
 * Markerar notiser som lästa och läser om listan, så att klockan visar rätt antal direkt. Det som inte
 * gick att markera visas som ett fel. Svaret är de id:n som inte blev markerade, så att anroparen kan
 * låta dem stå kvar.
 */
export const useAcknowledgeNotifications = (): ((ids: string[]) => Promise<string[]>) => {
  const { t } = useTranslation();
  const toastMessage = useSnackbar();
  const refreshNotifications = useRefreshNotifications();

  return useCallback(
    async (ids: string[]) => {
      const showError = (message: string) => {
        toastMessage({ position: 'bottom', closeable: false, message, status: 'error' });
      };

      let failed: string[];
      try {
        ({ failed } = await acknowledgeNotifications(ids));
      } catch {
        showError(t('api_errors.acknowledge_notifications', { count: ids.length }));
        return ids;
      }

      if (failed.length > 0) showError(t('api_errors.acknowledge_notifications', { count: failed.length }));

      try {
        await refreshNotifications();
      } catch {
        showError(t('api_errors.notifications'));
      }
      return failed;
    },
    [refreshNotifications, t, toastMessage]
  );
};
