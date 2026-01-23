import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';
import { AxiosResponse } from 'axios';

export const getStakeholderUsingPersonNumber = async (personNumber: string): Promise<AxiosResponse<StakeholderDTO>> => {
  const sanitizedPersonNumber = personNumber.replace('-', '');

  return apiService.get<StakeholderDTO>(`citizen/person/${sanitizedPersonNumber}`).then((res) => res);
};
