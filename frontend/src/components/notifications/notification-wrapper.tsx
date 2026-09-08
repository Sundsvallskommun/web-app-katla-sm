'use client';

import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap, useMediaQuery } from '@astryxdesign/core/hooks';
import { Layout, LayoutContent, Stack } from '@astryxdesign/core/Layout';
import { List } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
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
  const [isLoading, setIsLoading] = useState(true);
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
    <Stack gap={5}>
      <Text role="status" className="sr-only">
        {isLoading ? t('layout:notifications.loading') : ''}
      </Text>
      {error && <ErrorAlert message={error} />}
      {isLoading && !hasNotifications && !error ?
        <Stack gap={5} aria-hidden="true" data-cy="notification-skeleton">
          {[0, 1, 2].map((index) => (
            <Stack gap={2} key={index}>
              <Skeleton width="70%" height="1.25em" index={index} />
              <Skeleton width="35%" height="1em" index={index} />
              <Skeleton width="85%" height="1em" index={index} />
            </Stack>
          ))}
        </Stack>
      : <>
          {activeNotifications.length > 0 ?
            <List
              hasDividers
              header={
                <Stack direction="horizontal" align="center" gap={2}>
                  <Text as="h2" weight="semibold">
                    {t('layout:notifications.new')}
                  </Text>
                  <Badge label={activeNotifications.length} />
                </Stack>
              }
            >
              {activeNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </List>
          : !error &&
            !isLoading && (
              <Text as="p" color="secondary">
                {t('layout:notifications.none_new')}
              </Text>
            )
          }
          {acknowledgedNotifications.length > 0 && (
            <List
              hasDividers
              header={
                <Text as="h2" weight="semibold">
                  {t('layout:notifications.previous')}
                </Text>
              }
            >
              {acknowledgedNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </List>
          )}
        </>
      }
    </Stack>
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
      width={480}
      maxHeight={isMobile ? '100dvh' : '80dvh'}
    >
      <Layout
        header={
          <DialogHeader
            title={t('layout:notifications.panel')}
            startContent={<Bell size={20} aria-hidden="true" />}
            endContent={closeButton}
          />
        }
      >
        <LayoutContent data-cy="notification-content">{notificationContent}</LayoutContent>
      </Layout>
    </Dialog>
  );
};
