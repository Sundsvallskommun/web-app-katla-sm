import { StakeholderDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';
import { AxiosResponse } from 'axios';

export const getEmployeeStakeholderFromApi = async (username: string): Promise<AxiosResponse<StakeholderDTO>> => {
  return apiService.get<StakeholderDTO>(`employee/personal/${username}`).then((res) => res);
};

export const getEmployeeByPersonNumber = async (personNumber: string): Promise<AxiosResponse<StakeholderDTO>> => {
  const sanitizedPersonNumber = personNumber.replace('-', '');

  return apiService.get<StakeholderDTO>(`employee/personnumber/${sanitizedPersonNumber}`).then((res) => res);
};

export const getUserEmployments = async (): Promise<UserEmploymentDTO[]> => {
  return apiService.get<UserEmploymentDTO[]>(`employee/employments`).then((res) => res.data);
};
