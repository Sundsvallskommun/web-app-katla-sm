import { Body, Controller, Get, Param, Patch, Put, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import {
  IdentifierTypeEnum,
  PageSubscriberNotification,
  SubscriberNotification,
  SubscriberNotificationEvent,
} from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import {
  AcknowledgeNotificationsDTO,
  AcknowledgeNotificationsResultDTO,
  SupportNotificationDTO,
  SupportNotificationEventDTO,
} from '@/responses/notification.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';

/** Så många notiser som läses per sida från SupportManagement. */
const NOTIFICATION_PAGE_SIZE = 100;

/**
 * Ett tak för hur många sidor som läses. En rapportör har en notis per ärende, så taket nås inte i
 * praktiken; det finns för att ett felaktigt sidantal uppströms inte ska ge en oändlig läsning.
 */
const MAX_NOTIFICATION_PAGES = 20;

/** En notis som går att länka till och kvittera. Andra kan användaren inte göra något med. */
type CompleteNotification = SubscriberNotification & { id: string; created: string; errandId: string; errandNumber: string };

const isCompleteNotification = (notification: SubscriberNotification): notification is CompleteNotification =>
  !!notification.id && !!notification.created && !!notification.errandId && !!notification.errandNumber;

const eventTime = (event: SupportNotificationEventDTO): number => new Date(event.created ?? 0).getTime();

/**
 * Typerna jämförs i versaler, och en händelse utan egen tidpunkt får notisens: den måste ändå stå
 * någonstans i tidsordningen, och notisens tidpunkt är det närmaste som finns.
 */
const toEventDTO = (event: SubscriberNotificationEvent, notificationCreated: string): SupportNotificationEventDTO => ({
  created: event.created ?? notificationCreated,
  eventType: event.eventType?.toUpperCase(),
  subType: event.subType?.toUpperCase(),
  description: event.description,
});

/**
 * Senaste händelsen först. SupportManagement lovar ingen ordning, och panelen låter den första
 * händelsen stå för hela notisen, så ordningen bestäms här i stället för hos varje mottagare.
 */
const toNotificationDTO = (notification: CompleteNotification): SupportNotificationDTO => ({
  id: notification.id,
  created: notification.created,
  acknowledged: !!notification.acknowledged,
  errandId: notification.errandId,
  errandNumber: notification.errandNumber,
  events: (notification.events ?? [])
    .map(event => toEventDTO(event, notification.created))
    .sort((first, second) => eventTime(second) - eventTime(first)),
});

/**
 * Notiserna kommer ur SupportManagements prenumerationsmodell. SupportManagement prenumererar
 * rapportören på ärendet när det skapas, och samlar allt som hänt sedan rapportören senast kvitterade
 * i en notis per ärende.
 */
@Controller()
export class SupportManagementNotificationController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  private notificationsPath(): string {
    return `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications`;
  }

  private async readNotificationPage(req: RequestWithUser, page: number): Promise<PageSubscriberNotification> {
    const owner = `${IdentifierTypeEnum.AdAccount}/${encodeURIComponent(req.user.username)}`;
    const res = await this.apiService.get<PageSubscriberNotification>(
      { url: `${this.notificationsPath()}/${owner}`, params: { page, size: NOTIFICATION_PAGE_SIZE, sort: 'created,desc' } },
      req,
    );
    if (!Array.isArray(res.data?.content)) throw new HttpException(502, 'Invalid response when reading notifications');

    return res.data;
  }

  /**
   * Alla användarens notiser. SupportManagement svarar en sida i taget och behåller en kvitterad notis
   * tills den går ut, så ett ärendes notis kan ligga på vilken sida som helst. En notis som flyttas till
   * nästa sida medan sidorna läses tas bara med en gång.
   */
  private async readAllNotifications(req: RequestWithUser): Promise<CompleteNotification[]> {
    const notifications = new Map<string, CompleteNotification>();
    let incomplete = 0;

    for (let page = 0; page < MAX_NOTIFICATION_PAGES; page += 1) {
      const { content = [], totalPages = 1 } = await this.readNotificationPage(req, page);
      content.forEach(notification => {
        if (!isCompleteNotification(notification)) {
          incomplete += 1;
          return;
        }
        if (!notifications.has(notification.id)) notifications.set(notification.id, notification);
      });
      if (content.length === 0 || page + 1 >= totalPages) break;
      if (page + 1 === MAX_NOTIFICATION_PAGES) logger.warn(`Stopped reading notifications after ${MAX_NOTIFICATION_PAGES} pages`);
    }

    if (incomplete > 0) logger.warn(`Skipped ${incomplete} notification(s) without id, creation time or errand`);
    return [...notifications.values()];
  }

  /**
   * Kvitterar notiserna en i taget, eftersom SupportManagement bara tar en per anrop. Ett misslyckat id
   * samlas upp i stället för att kasta, så att de som gick igenom inte redovisas som misslyckade.
   * Kvittensen är användarens egen läsning, så ingen som följer ärendet får en notis om den.
   */
  private async acknowledge(req: RequestWithUser, ids: string[]): Promise<AcknowledgeNotificationsResultDTO> {
    const results = await Promise.allSettled(
      ids.map(id =>
        this.apiService.put<unknown>({ url: `${this.notificationsPath()}/${encodeURIComponent(id)}/acknowledge`, notifySubscribers: false }, req),
      ),
    );

    const acknowledged: string[] = [];
    const failed: string[] = [];
    results.forEach((result, index) => {
      const id = ids[index];
      if (id === undefined) return;
      if (result.status === 'fulfilled') {
        acknowledged.push(id);
      } else {
        failed.push(id);
        logger.error(`Failed to acknowledge notification ${id}`);
      }
    });
    return { acknowledged, failed };
  }

  @Get('/supportmanagement/notifications')
  @OpenAPI({ summary: 'Read the notifications of the signed-in user, one per errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(SupportNotificationDTO, { isArray: true })
  async getNotifications(@Req() req: RequestWithUser): Promise<SupportNotificationDTO[]> {
    const notifications = await this.readAllNotifications(req);

    return notifications.map(toNotificationDTO);
  }

  /**
   * Kvitterar de notiser användaren valt. SupportManagement kontrollerar inte vems en notis är, så bara
   * användarens egna kvitteras; ett id som inte är användarens redovisas som misslyckat.
   */
  @Patch('/supportmanagement/notifications/acknowledge')
  @OpenAPI({ summary: 'Acknowledge notifications of the signed-in user' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AcknowledgeNotificationsResultDTO)
  async acknowledgeNotifications(@Req() req: RequestWithUser, @Body() body: AcknowledgeNotificationsDTO): Promise<AcknowledgeNotificationsResultDTO> {
    const requestedIds = [...new Set(body.ids)];
    const ownNotifications = new Map((await this.readAllNotifications(req)).map(notification => [notification.id, notification]));
    const isOwn = (id: string): boolean => ownNotifications.has(id);
    const isAcknowledged = (id: string): boolean => !!ownNotifications.get(id)?.acknowledged;

    const foreignIds = requestedIds.filter(id => !isOwn(id));
    // En redan kvitterad notis är redan läst och behöver inte kvitteras igen.
    const alreadyAcknowledgedIds = requestedIds.filter(id => isOwn(id) && isAcknowledged(id));
    const unacknowledgedIds = requestedIds.filter(id => isOwn(id) && !isAcknowledged(id));

    const result = await this.acknowledge(req, unacknowledgedIds);
    return { acknowledged: [...alreadyAcknowledgedIds, ...result.acknowledged], failed: [...foreignIds, ...result.failed] };
  }

  /**
   * Kvitterar allt användaren har för ett ärende. Görs när ärendet öppnas: att öppna det är att läsa
   * dess notiser, hur användaren än kom dit. SupportManagement kan inte filtrera notiserna på ärende,
   * så hela listan läses och filtreras här.
   */
  @Put('/supportmanagement/errand/:errandId/notifications/acknowledge')
  @OpenAPI({ summary: 'Acknowledge every notification the signed-in user has for an errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(AcknowledgeNotificationsResultDTO)
  async acknowledgeErrandNotifications(@Req() req: RequestWithUser, @Param('errandId') errandId: string): Promise<AcknowledgeNotificationsResultDTO> {
    const notifications = await this.readAllNotifications(req);
    const ids = notifications
      .filter(notification => notification.errandId === errandId && !notification.acknowledged)
      .map(notification => notification.id);

    return this.acknowledge(req, ids);
  }
}
