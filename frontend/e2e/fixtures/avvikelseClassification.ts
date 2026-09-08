import type { LabelDTO } from '@data-contracts/backend/data-contracts';

/** Complete recipient labels and location default for tests focused on other form behavior. */
export const classificationLabels: LabelDTO[] = [
  {
    classification: 'TYPE',
    resourceName: 'REPORT_TYPE',
    resourcePath: 'REPORT_TYPE',
    labels: [
      { classification: 'TYPE', resourceName: 'DEVIATION', resourcePath: 'REPORT_TYPE/DEVIATION' },
      { classification: 'TYPE', resourceName: 'ABUSE', resourcePath: 'REPORT_TYPE/ABUSE' },
    ],
  },
  {
    classification: 'PLACE',
    resourceName: 'LOCATION',
    displayName: 'Platsstruktur',
    resourcePath: 'LOCATION',
    labels: [
      { classification: 'PLACE', resourceName: 'TEST', displayName: 'Testenhet', resourcePath: 'LOCATION/TEST' },
    ],
  },
];
export const facilitySchema = {
  type: 'object',
  default: { orgName: 'Testenhet' },
  properties: { orgName: { type: 'string' } },
};
