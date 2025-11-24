import { StakeholderDTO } from '@data-contracts/backend/data-contracts';

export const getReporterStakeholder: (stakeholders: StakeholderDTO[] | undefined) => StakeholderDTO | undefined = (
  stakeholders
) => stakeholders?.find((s) => s.role?.includes('REPORTER'));
