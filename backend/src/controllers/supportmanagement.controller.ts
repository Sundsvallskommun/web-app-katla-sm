import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, PageErrand } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { NotificationDTO } from '@/responses/notification.response';
import { MetadataResponseDTO } from '@/responses/supportmanagement-metadata.response';
import { ErrandsQueryDTO, PageErrandDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { apiURL } from '@/utils/util';
import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class SupportManagementController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  @Post('/supportmanagement/errand/create')
  @OpenAPI({ summary: 'Create new errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async createErrand(@Req() req: RequestWithUser, @Body() errand: Errand): Promise<Errand> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const baseURL = apiURL(this.apiBase);

    const errandInformation = {...errand, reporterUserId: req.user.username}

    try {
      const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandInformation }, req).catch(e => {
        logger.error('Error when initiating support errand');
        logger.error(e);
        throw e;
      });

      return res.data;
    } catch (error: any) {
      return {};
    }
  }

  @Patch('/supportmanagement/errand/save')
  @OpenAPI({ summary: 'Save an errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async saveErrand(@Req() req: RequestWithUser, @Body() errand: Errand): Promise<Errand> {

    if(!errand.id){
      logger.error('No errand id')
      return
    }

    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${errand.id}`;

    delete errand.activeNotifications;
    delete errand.created;
    delete errand.errandNumber;
    delete errand.id;
    delete errand.reporterUserId;
    delete errand.touched;
    delete errand.modified;

    const baseURL = apiURL(this.apiBase);

    try {
      const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errand }, req).catch(e => {
        logger.error('Error when initiating support errand');
        logger.error(e);
        throw e;
      });

      return res.data;
    } catch (error: any) {
      return {};
    }
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<Errand> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=errandNumber:'${errandNumber}'`;

    try {
      const res = await this.apiService.get<PageErrand>({ url }, req);

      if (!res.data.content[0]) throw new HttpException(500, 'No data from API');

      return res.data.content[0];
    } catch (error: any) {
      return {};
    }
  }

  @Get('/supportmanagement/errands')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<ApiResponse<PageErrand>> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append('page', String(query.page));
    if (query.size !== undefined) params.append('size', String(query.size));
    if (query.sort !== undefined) params.append('sort', String(query.sort));

    const filterParts: string[] = [];

    for (const key of Object.keys(query)) {
      if (['page', 'size', 'sort'].includes(key)) continue;
      const value = query[key];

      if (value !== undefined && value !== '') {
        filterParts.push(`${key}:'${value}'`);
      }
    }

    if (filterParts.length > 0) {
      params.append('filter', filterParts.join(','));
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    try {
      const res = await this.apiService.get<ApiResponse<PageErrand>>({ url: finalUrl }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return res.data;
    } catch (error: any) {
      if (error.status === 404) {
        return { data: {}, message: '404 from api' };
      }
      return { data: {}, message: 'error' };
    }
  }

  @Get('/supportmanagement/count')
  @OpenAPI({ summary: 'Count errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getNumberOfErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<ApiResponse<{ count: number }>> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands/count`;
    const params = new URLSearchParams();

    const filterParts: string[] = [];

    for (const key of Object.keys(query)) {
      const value = query[key];

      if (value !== undefined && value !== '') {
        filterParts.push(`${key}:'${value}'`);
      }
    }

    if (filterParts.length > 0) {
      params.append('filter', filterParts.join(','));
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    try {
      const res = await this.apiService.get<ApiResponse<{ count: number }>>({ url: finalUrl }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return res.data;
    } catch (error: any) {
      if (error.status === 404) {
        return { data: null, message: '404 from api' };
      }
      return { data: null, message: 'error' };
    }
  }

  @Get('/supportmanagement/metadata')
  @OpenAPI({ summary: 'Get all metadata for provided namespace and municipality' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MetadataResponseDTO)
  async getMetadata(@Req() req: RequestWithUser): Promise<ApiResponse<MetadataResponse>> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`;

    try {
      const res = await this.apiService.get<ApiResponse<MetadataResponse>>({ url }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return res.data;
    } catch (error: any) {
      if (error.status === 404) {
        return { data: null, message: '404 from api' };
      }
      return { data: null, message: 'error' };
    }
  }

  @Get('/supportmanagement/notifications')
  @OpenAPI({ summary: 'Get notifications for the namespace and municipality with the specified ownerId' })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationDTO)
  async getNotifications(@Req() req: RequestWithUser): Promise<ApiResponse<Notification[]>> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications?ownerId=${req.user.username}`;

    try {
      const res = await this.apiService.get<ApiResponse<Notification[]>>({ url }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return res.data;
    } catch (error: any) {
      if (error.status === 404) {
        return { data: null, message: '404 from api' };
      }
      return { data: null, message: 'error' };
    }
  }

  @Patch('/supportmanagement/notifications')
  @OpenAPI({ summary: 'Acknowledge notification' })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationDTO)
  async acknowlegeNotifications(@Req() req: RequestWithUser, @Body() notification: NotificationDTO): Promise<ApiResponse<Boolean>> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications`;

    try {
      const res = await this.apiService.patch<ApiResponse<Notification>>({ url, data: notification }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return { data: true, message: 'Success' };
    } catch (error: any) {
      if (error.status === 404) {
        return { data: false, message: '404 from api' };
      }
      return { data: false, message: 'error' };
    }
  }
}
