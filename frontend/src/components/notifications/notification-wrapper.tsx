'use client';

import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { Spinner } from '@astryxdesign/core/Spinner';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationItem } from './notification-item';

export const NotificationsWrapper: React.FC<{ show: boolean; setShow: (arg0: boolean) => void }> = ({
  show,
  setShow,
}) => {
  const { t } = useTranslation();
  const { activeNotifications, acknowledgedNotifications, setNotifications } = useNotificationStore();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: show });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getNotifications()
      .then((notifications) => {
        if (!active) return;
        setNotifications(notifications);
        setError(null);
      })
      .catch(() => {
        if (active) setError(t('api_errors.notifications'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [setNotifications, show, t]);

  const hasNotifications = activeNotifications.length > 0 || acknowledgedNotifications.length > 0;

  const notificationContent = (
    <div className="flex flex-col gap-6 overflow-auto p-5">
      {error && <ErrorAlert message={error} />}
      {isLoading && !hasNotifications && !error ?
        <div className="flex justify-center p-6">
          <Spinner label={t('layout:notifications.loading')} />
        </div>
      : <>
          <div className="flex flex-col gap-1">
            <h2 className="border-b border-default pb-3 font-semibold">{t('layout:notifications.new')}</h2>
            {activeNotifications.length > 0 ?
              <ul>
                {activeNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="my-4">{t('layout:notifications.none_new')}</div>
            : null}
          </div>
          <div>
            <h2 className="border-b border-default pb-3 font-semibold">{t('layout:notifications.previous')}</h2>
            {acknowledgedNotifications.length > 0 ?
              <ul>
                {acknowledgedNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="my-4">{t('layout:notifications.none_previous')}</div>
            : null}
          </div>
        </>
      }
    </div>
  );

  const closeButton = (
    <Button
      data-autofocus
      label={t('layout:notifications.close')}
      icon={<X aria-hidden="true" data-cy="close-message-wrapper-icon" size={20} />}
      isIconOnly
      variant="ghost"
      onClick={() => {
        setShow(false);
      }}
      data-cy="close-message-wrapper"
    />
  );

  return (
    <Dialog
      ref={containerRef}
      id="notifications-panel"
      isOpen={show}
      onOpenChange={setShow}
      aria-label={t('layout:notifications.panel')}
      purpose="form"
      variant={isMobile ? 'fullscreen' : 'standard'}
      width="min(560px, 100vw)"
      maxHeight="100dvh"
      padding={0}
    >
      <DialogHeader
        title={t('layout:notifications.panel')}
        startContent={<Mail aria-hidden="true" />}
        endContent={closeButton}
      />
      {notificationContent}
    </Dialog>
  );
};
