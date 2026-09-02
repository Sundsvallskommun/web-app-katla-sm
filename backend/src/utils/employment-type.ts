import { Employment } from '@/data-contracts/employee/data-contracts';
import { Parameter } from '@/data-contracts/supportmanagement/data-contracts';

/**
 * Anställningsformen kommer ur anställningen hos Employee-API:t, inte ur något användaren fyller
 * i: förmånsgrupp 44 är vikarie, allt annat är tillsvidareanställning. Den sparas som en parameter
 * på parten, eftersom den beskriver personen och inte ärendet.
 */
export const EMPLOYMENT_TYPE_KEY = 'employmentType';
export const EMPLOYMENT_TYPE_PERMANENT = 'TILLSVIDAREANSTALLD';
export const EMPLOYMENT_TYPE_SUBSTITUTE = 'VIKARIE';

const SUBSTITUTE_BENEFIT_GROUP_ID = 44;

export const getEmploymentType = (employment: Employment | undefined): string =>
  employment?.benefitGroupId === SUBSTITUTE_BENEFIT_GROUP_ID ? EMPLOYMENT_TYPE_SUBSTITUTE : EMPLOYMENT_TYPE_PERMANENT;

/**
 * Utan känd anställning sätts ingen parameter alls. Ett gissat värde vore ett påstående om
 * personen som ingenting stöder.
 */
export const employmentParameters = (employment: Employment | undefined): Parameter[] =>
  employment ? [{ key: EMPLOYMENT_TYPE_KEY, values: [getEmploymentType(employment)] }] : [];
