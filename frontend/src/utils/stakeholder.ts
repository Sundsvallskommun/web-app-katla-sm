import { RoleDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import type { TFunction } from 'i18next';
import { appConfig } from 'src/config/appconfig';
import * as yup from 'yup';

export const shouldShowContactDetails = (roles?: string[]) =>
  !(roles?.includes('PRIMARY') && appConfig.features.reducedStakeholderInfo);

export const emptyStakeholder: StakeholderDTO = {
  externalIdType: 'PERSON',
  externalId: '',
  personNumber: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  emails: [''],
  zipCode: '',
  phoneNumbers: [''],
  role: '',
};

const personNumberRegex = /^\d{8}-?\d{4}$/;
const phoneRegExp = /^$|^(?:\+|0)[0-9\s-]{6,19}$/;
const emailRegExp =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function phoneNumberFormatter(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return '';

  let formatted = phoneNumber.trim().replaceAll('-', '').replaceAll(' ', '');

  formatted = formatted.replace(/^0{3,}/, '00');

  if (formatted.startsWith('00')) {
    return formatted.replace(/^00/, '+');
  }

  if (formatted.startsWith('0')) {
    return formatted.replace(/^0/, '+46');
  }

  return formatted;
}

/**
 * Fabrik i stället för ett färdigt schema: yup binder felmeddelandena när schemat byggs,
 * så ett schema på modulnivå skulle låsa fast språket vid det som råkade gälla när modulen
 * lästes in. Anropas via useMemo på det aktiva språket.
 */
export const createStakeholderSchema = (t: TFunction) =>
  yup.object({
    firstName: yup.string().trim().required(t('validation:stakeholder.first_name_required')),
    lastName: yup.string().trim().required(t('validation:stakeholder.last_name_required')),
    personNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(personNumberRegex, {
        message: t('validation:stakeholder.person_number_format'),
        excludeEmptyString: true,
      })
      .test('valid-date', t('validation:stakeholder.person_number_invalid_date'), (value) => {
        if (!value) return true;
        const normalized = value.replace('-', '');

        const year = Number(normalized.slice(0, 4));
        const month = Number(normalized.slice(4, 6)) - 1;
        const day = Number(normalized.slice(6, 8));

        const date = new Date(year, month, day);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
      }),
    emails: yup
      .array()
      .of(
        yup.string().matches(emailRegExp, {
          message: t('validation:stakeholder.email_invalid'),
          excludeEmptyString: true,
        })
      )
      .notRequired(),
    phoneNumbers: yup
      .array()
      .of(yup.string().matches(phoneRegExp, t('validation:stakeholder.phone_invalid')).nullable().optional())
      .notRequired(),
  });

export type StakeholderSchema = ReturnType<typeof createStakeholderSchema>;

/**
 * Anställningsformen sparas som en parameter på parten själv, inte på ärendet: den beskriver
 * personen, och både rapportören och kollegan man rapporterar åt har var sin.
 */
export const EMPLOYMENT_TYPE_KEY = 'employmentType';
export const EMPLOYMENT_TYPE_PERMANENT = 'TILLSVIDAREANSTALLD';
export const EMPLOYMENT_TYPE_SUBSTITUTE = 'VIKARIE';
export const EMPLOYMENT_TYPES = [EMPLOYMENT_TYPE_PERMANENT, EMPLOYMENT_TYPE_SUBSTITUTE] as const;

/** Tillsvidareanställd är förvalet, så en part utan sparat val läses som det. */
export const getEmploymentType = (stakeholder: StakeholderDTO | undefined): string =>
  stakeholder?.parameters?.find((parameter) => parameter.key === EMPLOYMENT_TYPE_KEY)?.values?.[0] ??
  EMPLOYMENT_TYPE_PERMANENT;

/** Rollerna som har en anställningsform: rapportören och kollegan hen rapporterar åt. */
export const hasEmploymentType = (role: string | undefined): boolean =>
  ['REPORTER', 'CONTACT', 'SUBSTITUTEASSIGNMENT'].includes(role ?? '');

export const withEmploymentType = (stakeholder: StakeholderDTO, employmentType: string): StakeholderDTO => ({
  ...stakeholder,
  parameters: [
    ...(stakeholder.parameters ?? []).filter((parameter) => parameter.key !== EMPLOYMENT_TYPE_KEY),
    { key: EMPLOYMENT_TYPE_KEY, values: [employmentType] },
  ],
});

export const getReporterStakeholder: (stakeholders: StakeholderDTO[] | undefined) => StakeholderDTO | undefined = (
  stakeholders
) => stakeholders?.find((s) => s.role?.includes('REPORTER'));

export const getStakeholderRoleDisplayName: (stakeholder: StakeholderDTO, roles: RoleDTO[] | undefined) => string = (
  stakeholder,
  role
) => {
  return role?.find((role) => role?.name === stakeholder?.role)?.displayName ?? '';
};
