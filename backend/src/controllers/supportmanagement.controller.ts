import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, Notification, PageErrand } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import type ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { NotificationAcknowledgementResponse, NotificationDTO } from '@/responses/notification.response';
import { ErrandCountDTO, ErrandDTO, ErrandsQueryDTO, PageErrandDTO } from '@/responses/supportmanagement.response';
import { MetadataResponseDTO } from '@/responses/supportmanagement-metadata.response';
import ApiService from '@/services/api.service';
import {
  assertReporterOwnsErrand,
  prepareNotificationAcknowledgement,
  readReporterNotifications,
  requireReporterErrand,
} from '@/services/errand-access.service';
import { prepareErrandWrite } from '@/services/errand-submission.service';
import { logger } from '@/utils/logger';
import { mapStakeholderDTOToStakeholder, mapStakeholderToStakeholderDTO } from '@/utils/stakeholder-mapping';
import { apiURL } from '@/utils/util';

// Bygger filtervärdet på samma sätt som tidigare stränginterpolering; okända värdetyper hoppas över.
const toFilterValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value !== '' ? value : undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

// Uppströms filtergrammatik omger varje värde med enkelfnuttar. Värdena kommer
// från klienten, så tecken som kan avsluta literalen eller lägga till ett eget
// villkor avvisas i stället för att escapas: escapedialekten ägs av upstream och
// får inte gissas här.
const SAFE_FILTER_VALUE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

const toFilterTerm = (key: string, value: string): string => {
  if (!SAFE_FILTER_VALUE_PATTERN.test(value)) {
    throw new HttpException(400, 'Invalid filter value');
  }

  return `${key}:'${value}'`;
};

/**
 * Ett värde kan bära flera alternativ, kommaseparerade. Delningen sker före valideringen, så att
 * varje del prövas för sig — och eftersom komma inte är tillåtet i ett värde kan delningen inte
 * plocka isär något som var menat som ett enda värde.
 */
const toFilterValues = (value: unknown): string[] => {
  const filterValue = toFilterValue(value);
  if (filterValue === undefined) return [];

  return filterValue
    .split(',')
    .map(part => part.trim())
    .filter(part => part !== '');
};

/**
 * URLSearchParams kodar mellanslag som '+', vilket bara betyder mellanslag i formulärkodad data.
 * Filteruttrycket behöver mellanslag runt sina or-nyckelord, och '%20' betyder samma sak överallt.
 */
const toQueryString = (params: URLSearchParams): string => params.toString().replace(/\+/g, '%20');

/**
 * Filteruttrycket byggs här, inte av klienten: varje värde valideras för sig och grammatiken ägs
 * av oss. Flera värden på samma nyckel blir en or-grupp, så att t.ex. alla statusar utom de
 * avslutade kan hämtas som en och samma sida. Olika nycklar måste alla stämma.
 */
const buildErrandFilter = (query: ErrandsQueryDTO, username: string): string => {
  const terms = toFilterValues(query.status).map(value => toFilterTerm('status', value));
  const statusFilter = terms.length > 1 ? `(${terms.join(' or ')})` : terms[0];
  const ownerFilter = toFilterTerm('reporterUserId', username);
  return statusFilter ? `${statusFilter} and ${ownerFilter}` : ownerFilter;
};

@Controller()
export class SupportManagementController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  @Post('/supportmanagement/errand/create')
  @OpenAPI({ summary: 'Create new errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async createErrand(@Req() req: RequestWithUser, @Body() errand: ErrandDTO): Promise<ErrandDTO> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const baseURL = apiURL(this.apiBase);

    const errandInformation = {
      ...(await prepareErrandWrite(req, errand)),
      reporterUserId: req.user.username,
      stakeholders: errand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when creating errand');

    // Ärendet är skapat när vi kommer hit — svaret kommer från uppföljningen av Location.
    // Saknas parterna där är det inget skäl att rapportera inskickningen som misslyckad: den som
    // rapporterat skulle skicka in igen och skapa en dubblett. Det loggas i stället som en varning,
    // eftersom ett ärende utan parter är något som behöver följas upp.
    const resStakeholders = res.data.stakeholders;
    if (!resStakeholders) {
      logger.warn('Created errand came back without stakeholders');
    }

    const stakeholders = await Promise.all((resStakeholders ?? []).map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)));

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Patch('/supportmanagement/errand/save')
  @OpenAPI({ summary: 'Save an errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async saveErrand(@Req() req: RequestWithUser, @Body() errand: Errand): Promise<Partial<Errand>> {
    if (!errand.id) {
      throw new HttpException(400, 'Errand id is required when saving an errand');
    }

    const previous = await requireReporterErrand(req, errand.id);
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${encodeURIComponent(errand.id)}`;
    const {
      id: _id,
      activeNotifications: _notifications,
      created: _created,
      errandNumber: _number,
      reporterUserId: _reporter,
      touched: _touched,
      modified: _modified,
      ...editable
    } = errand;
    const prepared = await prepareErrandWrite(req, editable, previous);
    const errandInformation = { ...prepared, stakeholders: prepared.stakeholders?.map(mapStakeholderDTOToStakeholder) };

    const baseURL = apiURL(this.apiBase);

    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when saving errand');

    const stakeholders = await Promise.all(res.data.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? []);

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Patch('/supportmanagement/errand/:id')
  @OpenAPI({ summary: 'Update errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async updateErrand(@Req() req: RequestWithUser, @Param('id') id: string, @Body() errand: Partial<Errand>): Promise<Partial<Errand>> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${encodeURIComponent(id)}`;
    const baseURL = apiURL(this.apiBase);
    // Strip read-only fields that the API does not accept on update
    const {
      id: _id,
      errandNumber: _errandNumber,
      created: _created,
      modified: _modified,
      touched: _touched,
      reporterUserId: _reporterUserId,
      activeNotifications: _activeNotifications,
      ...errandData
    } = errand;

    if (!id.trim()) throw new HttpException(400, 'Errand id is required when updating an errand');

    const previous = await requireReporterErrand(req, id);
    const prepared = await prepareErrandWrite(req, errandData, previous);
    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: prepared, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when updating errand');

    return res.data;
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<ErrandDTO> {
    const filter = `${toFilterTerm('errandNumber', errandNumber)} and ${toFilterTerm('reporterUserId', req.user.username)}`;
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=${encodeURIComponent(filter)}`;

    const res = await this.apiService.get<PageErrand>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errand');

    const matchedErrand = res.data.content?.[0];
    if (!matchedErrand) throw new HttpException(404, 'Errand not found');
    assertReporterOwnsErrand(matchedErrand, req.user.username);

    const stakeholders = await Promise.all(matchedErrand.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? []);

    return {
      ...matchedErrand,
      stakeholders,
    };
  }

  @Get('/supportmanagement/errands')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<PageErrand> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append('page', String(query.page));
    if (query.size !== undefined) params.append('size', String(query.size));
    if (query.sort !== undefined) params.append('sort', query.sort);

    const filter = buildErrandFilter(query, req.user.username);
    if (filter) params.append('filter', filter);

    const queryString = toQueryString(params);
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const res = await this.apiService.get<PageErrand>({ url: finalUrl }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errands');
    for (const errand of res.data.content ?? []) assertReporterOwnsErrand(errand, req.user.username);

    return res.data;
  }

  @Get('/supportmanagement/count')
  @OpenAPI({ summary: 'Count errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandCountDTO)
  async getNumberOfErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<{ count: number }> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands/count`;
    const params = new URLSearchParams();

    const filter = buildErrandFilter(query, req.user.username);
    if (filter) params.append('filter', filter);

    const queryString = toQueryString(params);
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const res = await this.apiService.get<{ count: number }>({ url: finalUrl }, req);
    if (!res.data || typeof res.data.count !== 'number') throw new HttpException(502, 'Invalid response when counting errands');

    return res.data;
  }

  @Get('/supportmanagement/metadata')
  @OpenAPI({ summary: 'Get all metadata for provided namespace and municipality' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MetadataResponseDTO)
  async getMetadata(@Req() req: RequestWithUser): Promise<MetadataResponse> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`;

    const res = await this.apiService.get<MetadataResponse>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading metadata');

    return res.data;
  }

  @Get('/supportmanagement/notifications')
  @OpenAPI({ summary: 'Get notifications for the namespace and municipality with the specified ownerId' })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationDTO, { isArray: true })
  async getNotifications(@Req() req: RequestWithUser): Promise<Notification[]> {
    return readReporterNotifications(req);
  }

  @Patch('/supportmanagement/notifications')
  @OpenAPI({
    summary: 'Acknowledge notifications',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/NotificationDTO' },
          },
        },
      },
    },
  })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationAcknowledgementResponse)
  async acknowlegeNotifications(
    @Req() req: RequestWithUser,
    @Body({ required: false }) notifications: NotificationDTO[] | undefined,
  ): Promise<ApiResponse<boolean>> {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new HttpException(400, 'At least one notification is required');
    }

    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications`;

    // SupportManagement acknowledges with 204 No Content. A resolved request is
    // therefore the success signal; the gateway keeps its existing boolean body
    // for Katla clients.
    const ownedNotifications = await prepareNotificationAcknowledgement(req, notifications);
    await this.apiService.patch<undefined>({ url, data: ownedNotifications, propagateClientError: true }, req);

    return { data: true, message: 'Success' };
  }
}
