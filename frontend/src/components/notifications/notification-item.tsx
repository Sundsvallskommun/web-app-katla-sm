import { useToast } from '@astryxdesign/core/Toast';
import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { prettyTime } from '@services/helper-service';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationRenderIcon } from './notification-render-icon';

export const NotificationItem: React.FC<{ notification: NotificationDTO }> = ({ notification }) => {
  const toastMessage = useToast();
  const { t } = useTranslation();
  const { setNotifications } = useNotificationStore();

  const handleAcknowledge = async () => {
    try {
      await acknowledgeNotification(notification);
    } catch {
      toastMessage({
        body: t('api_errors.acknowledge_notification'),
        type: 'error',
      });
      return;
    }

    try {
      setNotifications(await getNotifications());
    } catch {
      toastMessage({
        body: t('api_errors.notifications'),
        type: 'error',
      });
    }
  };

  // Subtypen är språkneutral och används som nyckel. Saknar den översättning visas ingen
  // händelserad alls, precis som tidigare för okända subtyper.
  const subTypeLabel = t(`notification.subtype.${notification.subtype ?? ''}`, { defaultValue: '' });
  const sender = (notification.createdByFullName ?? '') || notification.createdBy;
  const senderName = !sender || sender.toUpperCase() === 'UNKNOWN' ? t('notification.unknown_sender') : sender;

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 border-b border-default py-4 text-sm">
      <div className="flex items-center my-1">
        <NotificationRenderIcon notification={notification} />
      </div>
      <div className="flex-grow">
        <div>
          <strong>{(notification.description ?? '') + ' › '}</strong>
          <NextLink
            href={`/arende/${notification.errandNumber}/grundinformation`}
            target="_blank"
            onClick={() => {
              void handleAcknowledge();
            }}
            rel="noopener noreferrer"
            className="underline break-words"
          >
            {(notification.errandNumber ?? '') || t('notification.to_errand')}
          </NextLink>
        </div>
        <div>{t('notification.from', { name: senderName })}</div>
        {subTypeLabel ?
          <div>{t('notification.event', { label: subTypeLabel })}</div>
        : null}
      </div>
      <span className="col-start-2 text-xs text-muted">{prettyTime(notification.created ?? '', t)}</span>
      {!notification.acknowledged && (
        <div className="col-start-3 row-start-1" aria-hidden="true">
          <span className="block h-2 w-2 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
};
