import { SupportNotificationDTO } from '@data-contracts/backend/data-contracts';
import { prettyTime } from '@services/helper-service';
import { Button, Checkbox, cx } from '@sk-web-gui/react';
import { notificationHref, notificationSummary, primaryEvent, subTypeLabel } from '@utils/notifications';
import { ChevronDown, ChevronRight } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAcknowledgeNotifications } from 'src/hooks/use-acknowledge-notifications';

import { NotificationEventItem } from './notification-event-item';
import { NotificationRenderIcon } from './notification-render-icon';

interface NotificationItemProps {
  notification: SupportNotificationDTO;
  /** Kryssrutan som väljer notisen för att markeras som läst. Bara nya notiser kan väljas. */
  selection?: { selected: boolean; onToggle: () => void };
}

/**
 * En notis per ärende, i en rad. Har flera saker hänt på ärendet sammanfattas de, till exempel
 * "3 nya meddelanden", och händelserna kan fällas ut under raden. Tio meddelanden på samma ärende är
 * en sak som hänt, inte tio.
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, selection }) => {
  const { t } = useTranslation();
  const acknowledge = useAcknowledgeNotifications();
  const [expanded, setExpanded] = useState(false);

  const event = primaryEvent(notification);
  const hasSeveralEvents = notification.events.length > 1;
  const eventTypeLabel = hasSeveralEvents ? undefined : subTypeLabel(event, t);
  const eventsId = `notification-events-${notification.id}`;

  return (
    <div data-cy="notification-item">
      <div className="p-16 flex gap-12 items-start justify-between text-small">
        {selection && (
          <div className="flex items-center my-xs">
            <Checkbox
              checked={selection.selected}
              onChange={selection.onToggle}
              aria-label={t('layout:notifications.select', { errandNumber: notification.errandNumber })}
              data-cy="notification-select"
            />
          </div>
        )}
        <div className="flex items-center my-xs">
          <NotificationRenderIcon subType={event?.subType} acknowledged={notification.acknowledged} />
        </div>
        <div className="flex-grow">
          <div>
            <strong>{`${notificationSummary(notification, t)} › `}</strong>
            <NextLink
              href={notificationHref(notification)}
              target="_blank"
              onClick={() => {
                // Ärendet markerar sina notiser som lästa när det öppnas, men i en ny flik. Klockan
                // här ska inte behöva vänta på nästa hämtning.
                if (!notification.acknowledged) void acknowledge([notification.id]);
              }}
              className="underline whitespace-nowrap"
            >
              {notification.errandNumber || t('notification.to_errand')}
            </NextLink>
          </div>
          {eventTypeLabel ?
            <div>{t('notification.event', { label: eventTypeLabel })}</div>
          : null}
          {hasSeveralEvents && (
            <Button
              variant="link"
              size="sm"
              className="px-0 text-dark-secondary"
              aria-expanded={expanded}
              aria-controls={expanded ? eventsId : undefined}
              leftIcon={expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
              onClick={() => {
                setExpanded((current) => !current);
              }}
              data-cy="notification-events-toggle"
            >
              {expanded ?
                t('layout:notifications.hide_events')
              : t('layout:notifications.show_events', { count: notification.events.length })}
            </Button>
          )}
        </div>
        <span className="whitespace-nowrap">{prettyTime(notification.created, t)}</span>
        {!notification.acknowledged && (
          <div>
            <span
              className={cx(
                `w-12 h-12 my-xs rounded-full flex items-center justify-center text-lg`,
                `bg-vattjom-surface-primary`
              )}
            />
          </div>
        )}
      </div>
      {hasSeveralEvents && expanded && (
        <ul id={eventsId} className="ml-36 pl-24 border-0 border-l-1 border-divider">
          {notification.events.map((notificationEvent, index) => (
            <li key={`${notificationEvent.created ?? ''}-${String(index)}`}>
              <NotificationEventItem event={notificationEvent} acknowledged={notification.acknowledged} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
