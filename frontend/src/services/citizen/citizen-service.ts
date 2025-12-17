import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';
import { AxiosResponse } from 'axios';

export const getStakeholderUsingPersonNumber = async (personNumber: string): Promise<AxiosResponse<StakeholderDTO>> => {
  
  return apiService.get<StakeholderDTO>(`citizen/person/${personNumber}`).then((res) => res);
};
