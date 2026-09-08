import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, Notification } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@/services/api.service';
import { apiURL } from '@/utils/util';

/** Katla äger rapportörens arbetsyta. Handläggarbehörigheter hör till Draken. */
export const assertReporterOwnsErrand = (errand: Errand, username: string): void => {
  if (errand.reporterUserId?.toLowerCase() !== username.toLowerCase()) {
    throw new HttpException(404, 'Errand not found');
  }
};

export const requireReporterErrand = async (req: RequestWithUser, errandId: string): Promise<Errand> => {
  if (typeof errandId !== 'string' || !errandId.trim()) throw new HttpException(400, 'Errand id is required');
  const response = await new ApiService().get<Errand>(
    {
      baseURL: apiURL(getApiBase('supportmanagement')),
      url: `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${encodeURIComponent(errandId)}`,
      propagateClientError: true,
    },
    req,
  );
  if (response.data?.id !== errandId) throw new HttpException(502, 'Invalid response when checking errand access');
  assertReporterOwnsErrand(response.data, req.user.username);
  return response.data;
};

/** Samma ägargräns för notislistan och kvittering; klienten får inte byta mottagare. */
export const readReporterNotifications = async (req: RequestWithUser): Promise<Notification[]> => {
  const response = await new ApiService().get<Notification[]>(
    {
      url: `${getApiBase('supportmanagement')}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications?ownerId=${encodeURIComponent(req.user.username)}`,
    },
    req,
  );
  if (!Array.isArray(response.data) || response.data.some(notification => notification.ownerId?.toLowerCase() !== req.user.username.toLowerCase())) {
    throw new HttpException(502, 'Invalid response when reading notifications');
  }
  return response.data;
};

export const prepareNotificationAcknowledgement = async (req: RequestWithUser, notifications: Notification[]): Promise<Notification[]> => {
  const current = await readReporterNotifications(req);
  return notifications.map(notification => {
    const owned = current.find(candidate => candidate.id && candidate.id === notification.id);
    if (!owned) throw new HttpException(404, 'Notification not found');
    return { ...owned, acknowledged: true };
  });
};
