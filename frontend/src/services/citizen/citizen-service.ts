import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

export const getStakeholderUsingPersonNumber = async (personNumber: string): Promise<StakeholderDTO> => {
  return apiService.get<StakeholderDTO>(`citizen/person/${personNumber}`).then((res) => res.data);
};
