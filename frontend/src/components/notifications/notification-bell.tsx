'use client';

import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

interface NotificationsBellProps {
  expanded: boolean;
  toggleShow: () => void;
}

export const NotificationsBell = ({ expanded, toggleShow }: NotificationsBellProps) => {
  const [isReady, setIsReady] = useState(false);
  // Server HTML can appear before hydration replaces the desktop header on mobile.
  // Do not accept a click until this button has its event handler and final layout.
  useEffect(() => {
    setIsReady(true);
  }, []);
  const { t } = useTranslation();
  const notificationCount = useNotificationStore((state) => state.activeNotifications.length);
  const accessibleName =
    notificationCount > 0 ?
      t('layout:notifications.open_with_count', { count: notificationCount })
    : t('layout:notifications.open');

  return (
    <span className="relative inline-flex">
      <Button
        label={accessibleName}
        aria-controls={expanded ? 'notifications-panel' : undefined}
        aria-expanded={expanded}
        isDisabled={!isReady}
        aria-haspopup="dialog"
        onClick={toggleShow}
        variant="ghost"
        isIconOnly
        icon={<Bell aria-hidden="true" />}
      />
      {notificationCount > 0 && (
        <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-1">
          <Badge label={notificationCount > 99 ? '99+' : notificationCount} />
        </span>
      )}
    </span>
  );
};
