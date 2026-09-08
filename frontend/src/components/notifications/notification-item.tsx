import { Stack } from '@astryxdesign/core/Layout';
import { ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { prettyTime } from '@services/helper-service';
import NextLink from 'next/link';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationRenderIcon } from './notification-render-icon';

export const NotificationItem: React.FC<{ notification: NotificationDTO }> = ({ notification }) => {
  const toastMessage = useToast();
  const linkRef = useRef<HTMLAnchorElement>(null);
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

  const subTypeLabel = t(`notification.subtype.${notification.subtype ?? ''}`, { defaultValue: '' });
  const description = (notification.description ?? '') || subTypeLabel;
  const sender = (notification.createdByFullName ?? '') || notification.createdBy;
  const senderName = !sender || sender.toUpperCase() === 'UNKNOWN' ? t('notification.unknown_sender') : sender;

  return (
    <ListItem
      data-cy="notification-item"
      interactiveRef={linkRef}
      startContent={<NotificationRenderIcon notification={notification} />}
      label={
        <Stack direction="vertical" gap={1} align="start">
          {description && (
            <Text as="p" weight={notification.acknowledged ? 'normal' : 'semibold'} className="break-words">
              {description}
            </Text>
          )}
          <NextLink
            ref={linkRef}
            href={`/arende/${notification.errandNumber}/grundinformation`}
            target="_blank"
            onClick={() => {
              void handleAcknowledge();
            }}
            rel="noopener noreferrer"
            // ListItem paints keyboard focus around the whole click target.
            className="underline break-words outline-0"
          >
            {(notification.errandNumber ?? '') || t('notification.to_errand')}
          </NextLink>
        </Stack>
      }
      description={
        <Stack direction="horizontal" wrap="wrap" gap={2}>
          <Text as="p" type="supporting" color="secondary">
            {t('notification.from', { name: senderName })}
          </Text>
          <Text type="supporting" color="secondary">
            <time dateTime={notification.created}>{prettyTime(notification.created ?? '', t)}</time>
          </Text>
        </Stack>
      }
    />
  );
};
