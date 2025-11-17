import { PageErrandDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service'; 

export interface ErrandQuery {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  statuses?: string[];
}

export const getErrands = async (q?: ErrandQuery): Promise<PageErrandDTO> => {
  const params: Record<string, string | number> = {};

  if (q?.statuses && q.statuses.length > 0) {
    params.status = q.statuses.join(',');
  }

  if (q?.page !== undefined) params.page = q.page;
  if (q?.size !== undefined) params.size = q.size;
  if (q?.sortColumn) {
    params.sort = `${q.sortColumn}%2C${q.sortOrder ?? 'desc'}`;
  }

  return apiService
    .get<PageErrandDTO>('supportmanagement/errands', {
      params: { ...params },
    })
    .then((res) => res.data);
};

export const getErrandsCount = async (q?: ErrandQuery): Promise<{count: number}> => {
  const params: Record<string, string | number> = {};

  if (q?.statuses && q.statuses.length > 0) {
    params.status = q.statuses.join(',');
  }

  return apiService
    .get<{count: number}>('supportmanagement/count', {
      params: { ...params },
    })
    .then((res) => res.data);
};