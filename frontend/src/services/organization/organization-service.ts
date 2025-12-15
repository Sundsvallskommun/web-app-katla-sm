import { OrgLeafNodeDTO, OrgSearchResponseDTO, OrgTreeNodeDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

export const searchOrganizations = async (searchString: string): Promise<OrgSearchResponseDTO> => {
  return apiService
    .get<OrgSearchResponseDTO>(`organization/search/${encodeURIComponent(searchString)}`)
    .then((res) => res.data);
};

export const getOrgTree = async (orgId: number): Promise<OrgTreeNodeDTO | null> => {
  return apiService.get<OrgTreeNodeDTO>(`organization/${orgId}/orgtree`).then((res) => res.data);
};

export const getOrgLeafNodes = async (orgId: number): Promise<OrgLeafNodeDTO[]> => {
  return apiService.get<OrgLeafNodeDTO[]>(`organization/${orgId}/leafnodes`).then((res) => res.data || []);
};
