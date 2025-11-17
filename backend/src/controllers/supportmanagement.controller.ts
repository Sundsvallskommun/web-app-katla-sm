import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { ErrandsQueryDTO, PageErrandDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { Controller, Get, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class SupportManagementController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  @Get('/supportmanagement/errands')
  @OpenAPI({ summary: 'Return a list of cases for current logged in user' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<ApiResponse<PageErrandDTO>> {
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
      const res = await this.apiService.get<ApiResponse<PageErrandDTO>>({ url: finalUrl }, req);

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
  @OpenAPI({ summary: 'Return a list of cases for current logged in user' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getNumberOfErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<ApiResponse<{count: number}>> {
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
      const res = await this.apiService.get<ApiResponse<{count: number}>>({ url: finalUrl }, req);

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
