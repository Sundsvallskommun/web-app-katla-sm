import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE, NODE_ENV } from '@/config';
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

/** Sidnavigering och sortering är egna parametrar uppströms och hör inte hemma i filtret. */
const ERRAND_QUERY_NON_FILTER_KEYS = ['page', 'size', 'sort'];

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
const buildErrandFilter = (query: ErrandsQueryDTO): string | undefined => {
  const queryEntries = query as unknown as Record<string, unknown>;
  const filterParts: string[] = [];

  for (const key of Object.keys(queryEntries)) {
    if (ERRAND_QUERY_NON_FILTER_KEYS.includes(key)) continue;

    const terms = toFilterValues(queryEntries[key]).map(value => toFilterTerm(key, value));
    const [firstTerm, ...remainingTerms] = terms;
    if (firstTerm === undefined) continue;

    filterParts.push(remainingTerms.length === 0 ? firstTerm : `(${terms.join(' or ')})`);
  }

  return filterParts.length > 0 ? filterParts.join(' and ') : undefined;
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
      ...(errand as Errand),
      reporterUserId: req.user.username,
      stakeholders: errand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    // Felsökning: exakt den JSON som går till SupportManagement. Bara i utvecklingsläge, och bara
    // till stdout — payloaden bär personuppgifter och ska inte hamna i de roterande loggfilerna.
    if (NODE_ENV === 'development') {
      console.warn(`[createErrand] POST ${baseURL}/${url}\n${JSON.stringify(errandInformation, null, 2)}`);
    }

    const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when creating errand');

    // Felsökning: vad API:t faktiskt sparade. Bara strukturen — antal och labelnamn — så att
    // svaret går att jämföra med utskriften ovan utan att personuppgifter loggas.
    if (NODE_ENV === 'development') {
      const created = res.data;
      console.warn(
        `[createErrand] svar ${created.errandNumber ?? '?'}: labels=${created.labels?.length ?? 0} [${
          created.labels?.map(label => label.resourceName).join(', ') ?? ''
        }] stakeholders=${created.stakeholders?.length ?? 0} parameters=${created.parameters?.length ?? 0} jsonParameters=${
          created.jsonParameters?.length ?? 0
        }`,
      );
    }

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

    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${errand.id}`;

    delete errand.activeNotifications;
    delete errand.created;
    delete errand.errandNumber;
    delete errand.id;
    delete errand.reporterUserId;
    delete errand.touched;
    delete errand.modified;

    const errandInformation = {
      ...errand,
      stakeholders: errand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

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
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}`;
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

    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandData, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when updating errand');

    return res.data;
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<ErrandDTO> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=${toFilterTerm('errandNumber', errandNumber)}`;

    const res = await this.apiService.get<PageErrand>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errand');

    const matchedErrand = res.data.content?.[0];
    if (!matchedErrand) throw new HttpException(404, 'Errand not found');

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

    const filter = buildErrandFilter(query);
    if (filter) params.append('filter', filter);

    const queryString = toQueryString(params);
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const res = await this.apiService.get<PageErrand>({ url: finalUrl }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errands');

    return res.data;
  }

  @Get('/supportmanagement/count')
  @OpenAPI({ summary: 'Count errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandCountDTO)
  async getNumberOfErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<{ count: number }> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands/count`;
    const params = new URLSearchParams();

    const filter = buildErrandFilter(query);
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
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications?ownerId=${req.user.username}`;

    const res = await this.apiService.get<Notification[]>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading notifications');

    return res.data;
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
    await this.apiService.patch<undefined>({ url, data: notifications, propagateClientError: true }, req);

    return { data: true, message: 'Success' };
  }
}
