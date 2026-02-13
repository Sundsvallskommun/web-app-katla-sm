import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';
import { AxiosResponse } from 'axios';

export const getEmployeeStakeholderFromApi = async (username: string): Promise<AxiosResponse<StakeholderDTO>> => {
  return apiService.get<StakeholderDTO>(`employee/personal/${username}`).then((res) => res);
};
