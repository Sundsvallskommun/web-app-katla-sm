import { StakeholderDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';

export const getEmployeeStakeholderFromApi = async (): Promise<StakeholderDTO> => {
  return apiService.get<StakeholderDTO>(`employee/personal/`).then((res) => res.data);
};

export const getUserEmployments = async (): Promise<UserEmploymentDTO[]> => {
  return apiService.get<UserEmploymentDTO[]>(`employee/employments`).then((res) => res.data);
};
