import { SupportNotificationEventDTO } from '@data-contracts/backend/data-contracts';
import { prettyTime } from '@services/helper-service';
import { eventLabel } from '@utils/notifications';
import { useTranslation } from 'react-i18next';

import { NotificationRenderIcon } from './notification-render-icon';

/**
 * En händelse i en utfälld notis. Utan länk och kryssruta: notisen markeras som läst i sin helhet, och
 * alla händelser i den gäller samma ärende.
 */
export const NotificationEventItem: React.FC<{ event: SupportNotificationEventDTO; acknowledged: boolean }> = ({
  event,
  acknowledged,
}) => {
  const { t } = useTranslation();

  return (
    <div className="py-12 flex gap-12 items-start justify-between text-small" data-cy="notification-event">
      <div className="flex items-center my-xs">
        <NotificationRenderIcon subType={event.subType} acknowledged={acknowledged} />
      </div>
      <div className="flex-grow">{eventLabel(event, t)}</div>
      <span className="whitespace-nowrap">{prettyTime(event.created ?? '', t)}</span>
    </div>
  );
};
