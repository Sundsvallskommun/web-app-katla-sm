import { LabelDTO, MetadataResponseDTO } from '@data-contracts/backend/data-contracts';

export const mockMetadata: MetadataResponseDTO = {
  categories: [
    {
      name: 'KATEGORI',
      displayName: 'test',
      types: [
        {
          name: 'TYPETEST',
          displayName: 'typtest',
          escalationEmail: '',
          created: '2025-12-08T11:49:39.992+01:00',
        },
      ],
      created: '2025-12-08T11:49:20.599+01:00',
    },
  ],
  labels: {
    labelStructure: [
      {
        id: '33d3d9e7-1ae2-4f58-a2cc-49c9a903fe12',
        classification: 'CATEGORY',
        displayName: 'Test',
        resourcePath: 'TEST',
        resourceName: 'TEST',
        labels: [
          {
            id: '3d5f41c0-106c-4ab3-8e61-c0ce7856cc72',
            classification: 'TYPE',
            displayName: 'Test2',
            resourcePath: 'TEST/TEST2',
            resourceName: 'TEST2',
            labels: [],
          },
        ],
      },
    ],
  },
  statuses: [
    {
      name: 'DRAFT',
      created: '2025-12-08T14:35:21.97+01:00',
    },
    {
      name: 'NEW',
      created: '2025-12-08T14:06:19.288+01:00',
    },
  ],
  roles: [
    {
      name: 'REPORTER',
      displayName: 'Rapportör',
      created: '2025-12-09T09:23:09.485+01:00',
    },
    {
      name: 'PRIMARY',
      displayName: 'Ärendeägare',
      created: '2025-12-09T09:23:09.485+01:00',
    },
    {
      name: 'CONTACT',
      displayName: 'Kontaktperson',
      created: '2025-12-09T09:23:09.485+01:00',
    },
  ],
};

export const MOCK_PLACE_NAME = 'Blå';
export const MOCK_PLACE_PARENT_NAME = 'VOF ÄB Skottsundsbacken geme.';

/**
 * Platsstruktur med en enhet och två avdelningar. Ett ärende går bara att spara när platsvalet
 * pekar ut en nod längst ned i strukturen, så registreringstesterna behöver minst en sådan.
 */
const mockPlaceStructure: LabelDTO = {
  id: 'e2e-location',
  classification: 'location-root',
  displayName: 'Platsstruktur',
  resourceName: 'LOCATION',
  resourcePath: 'LOCATION',
  labels: [
    {
      id: 'e2e-location-vof',
      classification: 'location',
      displayName: 'VOF Äldreboende',
      resourceName: 'VOF_ALDREBOENDE',
      resourcePath: 'LOCATION/VOF_ALDREBOENDE',
      labels: [
        {
          id: 'e2e-location-geme',
          classification: 'location',
          displayName: MOCK_PLACE_PARENT_NAME,
          resourceName: 'GEME',
          resourcePath: 'LOCATION/VOF_ALDREBOENDE/GEME',
          labels: [
            {
              id: 'e2e-location-bla',
              classification: 'location',
              displayName: MOCK_PLACE_NAME,
              resourceName: 'BLA',
              resourcePath: 'LOCATION/VOF_ALDREBOENDE/GEME/BLA',
              labels: [],
            },
            {
              id: 'e2e-location-gul',
              classification: 'location',
              displayName: 'Gul',
              resourceName: 'GUL',
              resourcePath: 'LOCATION/VOF_ALDREBOENDE/GEME/GUL',
              labels: [],
            },
          ],
        },
      ],
    },
  ],
};

export const mockMetadataWithPlaceStructure: MetadataResponseDTO = {
  ...mockMetadata,
  labels: {
    labelStructure: [...(mockMetadata.labels?.labelStructure ?? []), mockPlaceStructure],
  },
};
