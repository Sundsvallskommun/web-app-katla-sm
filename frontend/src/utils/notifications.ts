import { SupportNotificationDTO, SupportNotificationEventDTO } from '@data-contracts/backend/data-contracts';
import { errandMessagesPath } from '@utils/errand-paths';
import type { TFunction } from 'i18next';

/** SupportManagement markerar det som tagits bort med DELETE; allt annat är något som tillkommit eller ändrats. */
const isRemoval = (event: SupportNotificationEventDTO): boolean => event.eventType === 'DELETE';

/**
 * Händelsen som står för notisen i en hopfälld rad, alltså den senaste. Saknas när notisen inte bär
 * några händelser alls, vilket SupportManagement inte utesluter.
 */
export const primaryEvent = (notification: SupportNotificationDTO): SupportNotificationEventDTO | undefined =>
  notification.events[0];

/**
 * Vad det var som hände, till exempel "Ny bilaga" eller "Bilaga borttagen". Subtypen är språkneutral
 * och används som nyckel; saknar den översättning finns ingen etikett.
 */
export const subTypeLabel = (event: SupportNotificationEventDTO | undefined, t: TFunction): string | undefined => {
  if (!event?.subType) return undefined;
  const removalLabel = isRemoval(event) ? t(`notification.removed.${event.subType}`, { defaultValue: '' }) : '';
  return removalLabel || t(`notification.subtype.${event.subType}`, { defaultValue: '' }) || undefined;
};

/**
 * Vad en händelse heter i listan. Inte alla händelser har en beskrivning eller en subtyp, så det finns
 * en allmän etikett att falla tillbaka på i stället för en tom rad.
 */
export const eventLabel = (event: SupportNotificationEventDTO | undefined, t: TFunction): string =>
  event?.description ?? subTypeLabel(event, t) ?? t('notification.default_label');

/**
 * Notisen i en rad, till exempel "3 nya meddelanden". Antalet får ett eget substantiv bara när alla
 * händelser är av samma slag och inget har tagits bort; annars är det "nya händelser".
 */
export const notificationSummary = (notification: SupportNotificationDTO, t: TFunction): string => {
  const { events } = notification;
  if (events.length <= 1) return eventLabel(primaryEvent(notification), t);

  const subTypes = new Set(events.map((event) => event.subType));
  const [sharedSubType] = subTypes.size === 1 ? [...subTypes] : [];
  const summaryOptions = { amount: events.length, defaultValue: '' };
  const sharedSummary =
    sharedSubType && !events.some(isRemoval) ? t(`notification.summary.${sharedSubType}`, summaryOptions) : '';

  return sharedSummary || t('notification.summary.mixed', { amount: events.length });
};

/** Senaste notisen först; API:t lovar ingen ordning. */
export const newestFirst = (notifications: SupportNotificationDTO[]): SupportNotificationDTO[] =>
  [...notifications].sort((first, second) => new Date(second.created).getTime() - new Date(first.created).getTime());

/** Ärendet som notisen gäller, öppnat på meddelandefliken som alla ärenden. */
export const notificationHref = (notification: SupportNotificationDTO): string =>
  errandMessagesPath(notification.errandNumber);
