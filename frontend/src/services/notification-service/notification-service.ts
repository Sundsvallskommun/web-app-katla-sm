import {
  AcknowledgeNotificationsDTO,
  AcknowledgeNotificationsResultDTO,
  SupportNotificationDTO,
} from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

/** Användarens notiser, en per ärende, med det som hänt sedan hen senast läste dem. */
export const getNotifications = async (): Promise<SupportNotificationDTO[]> =>
  apiService.get<SupportNotificationDTO[]>('supportmanagement/notifications').then((res) => res.data);

/**
 * Markerar notiserna som lästa i en och samma begäran. Ett id som inte gick att kvittera kommer
 * tillbaka i `failed` i stället för att begäran avvisas.
 */
export const acknowledgeNotifications = async (ids: string[]): Promise<AcknowledgeNotificationsResultDTO> => {
  if (ids.length === 0) return { acknowledged: [], failed: [] };

  return apiService
    .patch<AcknowledgeNotificationsResultDTO>('supportmanagement/notifications/acknowledge', {
      ids,
    } satisfies AcknowledgeNotificationsDTO)
    .then((res) => res.data);
};

/** Markerar allt användaren har för ett ärende som läst, till exempel när ärendet öppnas. */
export const acknowledgeErrandNotifications = async (errandId: string): Promise<AcknowledgeNotificationsResultDTO> =>
  apiService
    .put<AcknowledgeNotificationsResultDTO>(
      `supportmanagement/errand/${encodeURIComponent(errandId)}/notifications/acknowledge`,
      {}
    )
    .then((res) => res.data);
