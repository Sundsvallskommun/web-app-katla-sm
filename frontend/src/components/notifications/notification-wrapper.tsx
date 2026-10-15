'use client';

import { ErrorAlert } from '@components/misc/error-alert.component';
import { MainPageMobileHeader } from '@components/mobile/main-page-mobile-header.component';
import { ModalLayer } from '@components/modal-layer/modal-layer.component';
import { Button, Checkbox, cx, Divider, Header, Spinner, useSnackbar } from '@sk-web-gui/react';
import { Mail, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useAcknowledgeNotifications } from 'src/hooks/use-acknowledge-notifications';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useNotificationPoller } from 'src/hooks/use-notification-poller';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationItem } from './notification-item';

export const NotificationsWrapper: React.FC<{ show: boolean; setShow: (arg0: boolean) => void }> = ({
  show,
  setShow,
}) => {
  const { t } = useTranslation();
  const toastMessage = useSnackbar();
  const { activeNotifications, acknowledgedNotifications } = useNotificationStore();
  const { loadState, refresh } = useNotificationPoller();
  const acknowledge = useAcknowledgeNotifications();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show) {
      void refresh();
    } else {
      setSelectedIds(new Set());
    }
  }, [refresh, show]);

  // Ett val som gällde en notis som inte längre är ny räknas inte.
  const selectedNotifications = activeNotifications.filter((notification) => selectedIds.has(notification.id));
  const allNewSelected = activeNotifications.length > 0 && selectedNotifications.length === activeNotifications.length;
  const isLoading = loadState === 'loading';
  const error = loadState === 'error' ? t('api_errors.notifications') : null;
  const hasNotifications = activeNotifications.length > 0 || acknowledgedNotifications.length > 0;

  const toggleSelected = (notificationId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(notificationId)) next.add(notificationId);
      return next;
    });
  };

  const toggleAllNew = () => {
    setSelectedIds(allNewSelected ? new Set() : new Set(activeNotifications.map((notification) => notification.id)));
  };

  const markSelectedAsRead = async () => {
    const ids = selectedNotifications.map((notification) => notification.id);
    setIsAcknowledging(true);
    const failed = await acknowledge(ids);
    // De som inte gick att markera står kvar som valda, så att ett nytt försök inte kräver nya kryss.
    setSelectedIds(new Set(failed));
    setIsAcknowledging(false);

    const markedCount = ids.length - failed.length;
    if (markedCount > 0) {
      toastMessage({
        position: 'bottom',
        closeable: true,
        message: t('layout:notifications.marked_as_read', { count: markedCount }),
        status: 'success',
      });
    }
  };

  const notificationContent = (
    <div className="flex-grow mt-sm mb-0 p-24 pt-0 flex flex-col gap-24 overflow-auto">
      {error && <ErrorAlert message={error} />}
      {isLoading && !hasNotifications && !error ?
        <div className="flex justify-center p-24">
          <Spinner aria-label={t('layout:notifications.loading')} />
        </div>
      : <>
          <div className="flex flex-col gap-4">
            <Divider.Section>
              <div className="flex gap-sm items-center">
                {activeNotifications.length > 0 && (
                  <Checkbox
                    checked={allNewSelected}
                    indeterminate={selectedNotifications.length > 0 && !allNewSelected}
                    onChange={toggleAllNew}
                    aria-label={t('layout:notifications.select_all_new')}
                    data-cy="notification-select-all"
                  />
                )}
                <h2 className="text-h4-sm">{t('layout:notifications.new')}</h2>
              </div>
            </Divider.Section>
            {selectedNotifications.length > 0 && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  color="vattjom"
                  loading={isAcknowledging}
                  disabled={isAcknowledging}
                  onClick={() => {
                    void markSelectedAsRead();
                  }}
                  data-cy="mark-notifications-as-read"
                >
                  {t('layout:notifications.mark_as_read', { count: selectedNotifications.length })}
                </Button>
              </div>
            )}
            {activeNotifications.length > 0 ?
              <ul>
                {activeNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      selection={{
                        selected: selectedIds.has(notification.id),
                        onToggle: () => {
                          toggleSelected(notification.id);
                        },
                      }}
                    />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="m-md">{t('layout:notifications.none_new')}</div>
            : null}
          </div>
          <div>
            <Divider.Section>
              <div className="flex gap-sm items-center">
                <h2 className="text-h4-sm">{t('layout:notifications.previous')}</h2>
              </div>
            </Divider.Section>
            {acknowledgedNotifications.length > 0 ?
              <ul>
                {acknowledgedNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="m-md">{t('layout:notifications.none_previous')}</div>
            : null}
          </div>
        </>
      }
    </div>
  );

  const closeButton = (
    <Button
      ref={closeButtonRef}
      inverted={isMobile}
      aria-label={t('layout:notifications.close')}
      iconButton
      variant="tertiary"
      onClick={() => {
        setShow(false);
      }}
      data-cy="close-message-wrapper"
    >
      <X aria-hidden="true" data-cy="close-message-wrapper-icon" />
    </Button>
  );

  return (
    <ModalLayer
      id="notifications-panel"
      show={show}
      onClose={() => {
        setShow(false);
      }}
      label={t('layout:notifications.panel')}
      initialFocus={closeButtonRef}
      className={cx(
        'inset-y-0 right-0 h-[100dvh] w-full gap-0 rounded-none shadow-100',
        isMobile ?
          'left-0 pb-[env(safe-area-inset-bottom)]'
        : 'left-auto border-1 border-y-0 border-r-0 md:min-w-[50rem] md:w-[50vw] lg:w-[38vw]'
      )}
    >
      {isMobile ?
        <MainPageMobileHeader actions={closeButton}>{notificationContent}</MainPageMobileHeader>
      : <>
          <Header className="h-[64px] shrink-0 flex justify-between" wrapperClasses="py-4 px-40">
            <div className="text-h4-sm flex items-center gap-12">
              <Mail aria-hidden="true" /> {t('layout:notifications.panel')}
            </div>
            {closeButton}
          </Header>
          {notificationContent}
        </>
      }
    </ModalLayer>
  );
};
