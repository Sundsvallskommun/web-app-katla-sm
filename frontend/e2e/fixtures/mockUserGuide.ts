import type { ErrandDTO, PageErrandDTO, StakeholderDTO, User } from '@data-contracts/backend/data-contracts';
import type { ApiResponse } from '@services/api-service';

import schemaReference from '../../../backend/src/local-schemas/avvikelse-plats-handelse.schema.json';
import uiSchemaReference from '../../../backend/src/local-schemas/avvikelse-plats-handelse.ui-schema.json';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER, MOCK_HYPHEN_PERSON_NUMBER } from '../utils/constants';
import { mockErrand } from './mockErrand';

/**
 * Data för användarguidens skärmbilder. Allt syns i guiden, så värdena ska se ut som en vanlig
 * rapport – men vara påhittade: personnumret och telefonnumret är Skatteverkets respektive
 * PTS testnummer, och e-postadresserna ligger under example.com.
 */

export const USER_GUIDE_EMAIL = 'alex.andersson@example.com';
export const USER_GUIDE_USER_EMAIL = 'kim.exempelsson@example.com';
export const USER_GUIDE_EVENT_DATE = '2026-10-05';
export const USER_GUIDE_EVENT_DESCRIPTION =
  'Vid förmiddagens läkemedelsutdelning fick brukaren sin kvällsdos i stället för morgondosen. ' +
  'Felet upptäcktes vid lunch när signeringslistan kontrollerades. Ansvarig sjuksköterska kontaktades direkt.';

export const userGuideMe: ApiResponse<User> = {
  data: { username: 'alean01', name: 'Alex Andersson', initials: 'AA' },
  message: 'success',
};

export const userGuideReporter: StakeholderDTO = {
  externalId: '0f6e5c1a-2b3d-4e5f-8a9b-0c1d2e3f4a5b',
  firstName: 'Alex',
  lastName: 'Andersson',
  address: '',
  zipCode: '',
  city: '',
  emails: [USER_GUIDE_EMAIL],
  phoneNumbers: [MOCK_COUNTRY_CODE_PHONE_NUMBER],
  role: 'REPORTER',
  title: 'Undersköterska',
  department: 'Hemtjänst Centrum',
};

export const userGuideCareRecipient: StakeholderDTO = {
  personNumber: MOCK_HYPHEN_PERSON_NUMBER,
  externalId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  firstName: 'Kim',
  lastName: 'Exempelsson',
  address: 'Exempelvägen 1',
  zipCode: '123 45',
  city: 'Sundsvall',
  careOf: '',
};

const createErrand = (errandNumber: string, eventType: string, status: string, created: string): ErrandDTO => ({
  ...mockErrand,
  id: `user-guide-${errandNumber}`,
  errandNumber,
  stakeholders: [userGuideReporter],
  parameters: [{ key: 'eventType', values: [eventType] }],
  status,
  created,
  touched: created,
});

const userGuideErrandList: ErrandDTO[] = [
  createErrand('KAT-26100012', 'AVVIKELSE', 'NEW', '2026-10-02T09:12:00+02:00'),
  createErrand('KAT-26090087', 'AVVIKELSE', 'ASSIGNED', '2026-09-24T14:35:00+02:00'),
  createErrand('KAT-26090041', 'MISSFORHALLANDE', 'INQUIRY', '2026-09-11T08:05:00+02:00'),
];

export const userGuideErrands: PageErrandDTO = {
  content: userGuideErrandList,
  pageable: { pageNumber: 0, pageSize: 12, offset: 0, paged: true, unpaged: false },
  last: true,
  totalElements: userGuideErrandList.length,
  totalPages: 1,
  size: 12,
  number: 0,
  first: true,
  numberOfElements: userGuideErrandList.length,
  empty: false,
};

/** Svaret API:t ger för svenska: x-i18n-blocken tas bort och den svenska texten står kvar. */
const withoutLocaleExtensions = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutLocaleExtensions);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'x-i18n')
      .map(([key, nested]) => [key, withoutLocaleExtensions(nested)])
  );
};

/**
 * Avvikelseschemat som backend senast höll lokalt. Det är samma referens som enhetstesterna
 * använder, så att bilderna visar de riktiga frågorna i stället för ett förenklat testschema.
 */
export const userGuideFormSchemaName = schemaReference.name;
export const userGuideFormSchemaId = schemaReference.id;
export const userGuideFormSchema = {
  schemaId: schemaReference.id,
  schema: schemaReference.value,
  uiSchema: withoutLocaleExtensions(uiSchemaReference.value),
};
