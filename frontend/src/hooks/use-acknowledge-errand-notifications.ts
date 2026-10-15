'use client';

import { acknowledgeErrandNotifications } from '@services/notification-service/notification-service';
import { useEffect, useRef } from 'react';

import { useRefreshNotifications } from './use-refresh-notifications';

/**
 * Markerar användarens notiser för ett ärende som lästa när ärendet öppnas. Att öppna ärendet är att
 * läsa det som hänt där, hur användaren än kom dit: från en notis, från översikten eller via en länk.
 * Det görs en gång per ärende och sidvisning. Ett fel lämnar bara notiserna olästa, och avbryter
 * därför inte användaren; de syns kvar i notispanelen.
 */
export const useAcknowledgeErrandNotifications = (errandId: string | undefined): void => {
  const refreshNotifications = useRefreshNotifications();
  const acknowledgedErrandId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!errandId || acknowledgedErrandId.current === errandId) return;
    acknowledgedErrandId.current = errandId;

    acknowledgeErrandNotifications(errandId)
      // Klockan läser ur storen och skulle annars visa det gamla antalet till nästa hämtning.
      .then((result) => (result.acknowledged.length > 0 ? refreshNotifications() : undefined))
      .catch(() => undefined);
  }, [errandId, refreshNotifications]);
};
