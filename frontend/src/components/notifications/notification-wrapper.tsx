'use client';

import { ErrorAlert } from '@components/misc/error-alert.component';
import { MainPageMobileHeader } from '@components/mobile/main-page-mobile-header.component';
import { ModalLayer } from '@components/modal-layer/modal-layer.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { Button, cx, Divider, Header, Spinner } from '@sk-web-gui/react';
import { Mail, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
                <h2 className="text-h4-sm">{t('layout:notifications.new')}</h2>
              </div>
            </Divider.Section>
            {activeNotifications.length > 0 ?
              <ul>
                {activeNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
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
