import { ErrandDTO, MetadataResponseDTO, PageErrandDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

export interface ErrandQuery {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  statuses?: string[];
}

export const getErrandUsingErrandNumber = async (errandNumber: string): Promise<ErrandDTO> => {
  return apiService.get<ErrandDTO>(`supportmanagement/errand/${errandNumber}`).then((res) => res.data);
};

type ErrandParams = Record<string, string | number>;

/**
 * Statusarna skickas kommaseparerade i en parameter — upprepade parametrar slås ihop av backendens
 * hpp-skydd. Backend delar upp värdet, validerar varje status för sig och bygger filteruttrycket.
 * Listan kan innehålla flera statusar, eftersom Inskickade är alla som inte är avslutade.
 */
const toStatusParams = (statuses: string[] | undefined): ErrandParams =>
  statuses && statuses.length > 0 ? { status: statuses.join(',') } : {};

export const getErrands = async (q?: ErrandQuery): Promise<PageErrandDTO> => {
  const params: ErrandParams = toStatusParams(q?.statuses);

  if (q?.page !== undefined) params.page = q.page;
  if (q?.size !== undefined) params.size = q.size;
  if (q?.sortColumn) {
    params.sort = `${q.sortColumn},${q.sortOrder ?? 'desc'}`;
  }

  return apiService.get<PageErrandDTO>('supportmanagement/errands', { params }).then((res) => res.data);
};

export const getErrandsCount = async (q?: ErrandQuery): Promise<{ count: number }> => {
  return apiService
    .get<{ count: number }>('supportmanagement/count', { params: toStatusParams(q?.statuses) })
    .then((res) => res.data);
};

export const getMetadata = async (): Promise<MetadataResponseDTO> => {
  return apiService.get<MetadataResponseDTO>('supportmanagement/metadata').then((res) => res.data);
};

export const createErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return apiService.post<ErrandDTO>('supportmanagement/errand/create', errand).then((res) => res.data);
};

export const updateErrand = async (id: string, errand: Partial<ErrandDTO>): Promise<ErrandDTO> => {
  return apiService.patch<ErrandDTO>(`supportmanagement/errand/${id}`, errand).then((res) => res.data);
};

export const saveErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return apiService.patch<ErrandDTO>('supportmanagement/errand/save', errand).then((res) => res.data);
};

export const upsertErrand = async (errand: ErrandDTO): Promise<ErrandDTO> => {
  return errand.id ? saveErrand(errand) : createErrand(errand);
};
