import { StakeholderDTO } from '@data-contracts/backend/data-contracts';

export const mockReporterStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  city: '',
  firstName: 'Test',
  lastName: 'Testsson',
  address: '',
  zipCode: '',
  emails: [Cypress.env('mockEmail')],
  phoneNumbers: [Cypress.env('mockCountryCodePhoneNumber')],
  role: 'REPORTER',
  title: 'mockTitle',
  department: 'mockDepartment'
};

export const mockStakeholder: StakeholderDTO = {
  personNumber: Cypress.env('mockHyphenPersonNumber'),
  externalId: 'aaaaaaaa-ffff-cccc-dddd-eeeeeeeeeeee',
  city: 'mockCity',
  firstName: 'Mock',
  lastName: 'Person',
  address: 'mockAddress 1',
  zipCode: '12345',
  careOf: '',
};

export const mockManualEditStakeholder: StakeholderDTO = {
  externalId: 'aaaaaaaa-ffff-gggg-dddd-eeeeeeeeeeee',
  city: 'mockEditCity',
  firstName: 'TestFirstName',
  lastName: 'TestLastName',
  address: 'mockAddress 2',
  zipCode: '12346',
  careOf: 'mockEditCareOf'
};