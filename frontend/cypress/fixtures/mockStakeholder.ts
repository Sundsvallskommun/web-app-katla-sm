import { StakeholderDTO } from '@data-contracts/backend/data-contracts';

export const mockReporterStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  city: '',
  firstName: 'Test',
  lastName: 'Testsson',
  address: '',
  zipCode: '',
  contactChannels: [
    {
      type: 'PHONE',
      value: Cypress.env('mockPhoneNumber'),
    },
    {
      type: 'EMAIL',
      value: Cypress.env('mockEmail'),
    },
  ],
};

export const mockStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-ffff-cccc-dddd-eeeeeeeeeeee',
  city: 'mockCity',
  firstName: 'Mock',
  lastName: 'Person',
  address: 'mockAddress 1',
  zipCode: '12345',
  contactChannels: [
    {
      type: 'PHONE',
      value: Cypress.env('mockPhoneNumber'),
    },
    {
      type: 'EMAIL',
      value: Cypress.env('mockEmail'),
    },
  ],
};