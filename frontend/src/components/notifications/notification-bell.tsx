'use client';

import { Badge, Button } from '@sk-web-gui/react';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

interface NotificationsBellProps {
  expanded: boolean;
  toggleShow: () => void;
  /** Sidhuvudet i ärendevyn är mörkt; knappen måste då rita sig ljus för att synas. */
  inverted?: boolean;
}

export const NotificationsBell = ({ expanded, toggleShow, inverted = false }: NotificationsBellProps) => {
  const [isReady, setIsReady] = useState(false);
  // Server HTML can appear before hydration replaces the desktop header on mobile.
  // Do not accept a click until this button has its event handler and final layout.
  useEffect(() => {
    setIsReady(true);
  }, []);
  const { t } = useTranslation();
  const { activeNotifications } = useNotificationStore();
  const notificationCount = activeNotifications.length;
  const accessibleName =
    notificationCount > 0 ?
      t('layout:notifications.open_with_count', { count: notificationCount })
    : t('layout:notifications.open');

  return (
    <Button
      size="md"
      aria-label={accessibleName}
      aria-controls={expanded ? 'notifications-panel' : undefined}
      aria-expanded={expanded}
      disabled={!isReady}
      onClick={toggleShow}
      className="mx-md"
      inverted={inverted}
      // Mot den mörka bakgrunden räcker ikonen: en knappyta där ritar en ruta runt den
      // som designen inte har.
      showBackground={!inverted}
      variant="tertiary"
      iconButton
      leftIcon={<Bell aria-hidden="true" />}
    >
      {notificationCount > 0 && (
        <Badge
          aria-hidden="true"
          className="absolute -top-10 -right-10 text-white"
          rounded
          color="vattjom"
          counter={notificationCount > 99 ? '99+' : notificationCount}
        />
      )}
    </Button>
  );
};
