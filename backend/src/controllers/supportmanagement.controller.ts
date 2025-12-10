import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, PageErrand } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
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
    const errandData = { ...errand, reporterUserId: req.user?.username };

    try {
      const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandData }, req).catch(e => {
        logger.error('Error when initiating support errand');
        logger.error(e);
        throw e;
      });

      return res.data;
    } catch (error: any) {
      throw new HttpException(500, 'Failed to create errand');
    }
  }

  @Patch('/supportmanagement/errand/:id')
  @OpenAPI({ summary: 'Update errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async updateErrand(@Req() req: RequestWithUser, @Param('id') id: string, @Body() errand: Partial<Errand>): Promise<Errand> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}`;
    const baseURL = apiURL(this.apiBase);
    // Strip read-only fields that the API does not accept on update
    const { id: _id, errandNumber, created, modified, touched, reporterUserId, activeNotifications, ...errandData } = errand;

    try {
      const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandData }, req).catch(e => {
        logger.error('Error when updating support errand');
        logger.error(e);
        throw e;
      });

      return res.data;
    } catch (error: any) {
      throw new HttpException(500, 'Failed to update errand');
    }
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<Errand> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=errandNumber:'${errandNumber}'`;

    try {
      const res = await this.apiService.get<PageErrand>({ url: url }, req);

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
    const Url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`;

    try {
      const res = await this.apiService.get<ApiResponse<MetadataResponse>>({ url: Url }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      return res.data;
    } catch (error: any) {
      if (error.status === 404) {
        return { data: null, message: '404 from api' };
      }
      return { data: null, message: 'error' };
    }
  }
}
