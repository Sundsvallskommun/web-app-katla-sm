import { describe, expect, it } from 'vitest';

import { Employment } from '@/data-contracts/employee/data-contracts';
import { EMPLOYMENT_TYPE_KEY, EMPLOYMENT_TYPE_PERMANENT, EMPLOYMENT_TYPE_SUBSTITUTE, employmentParameters } from '@/utils/employment-type';

const employment = (benefitGroupId?: number | null): Employment => ({ benefitGroupId, isMainEmployment: true });

/**
 * Anställningsformen fylls inte i av användaren utan läses ur anställningen. Förmånsgrupp 44 är
 * vikarie; regeln ligger på ett ställe eftersom både rapportören och kollegan går genom den.
 */
describe('employment type', () => {
  it.each([
    ['benefit group 44', 44, EMPLOYMENT_TYPE_SUBSTITUTE],
    ['any other benefit group', 12, EMPLOYMENT_TYPE_PERMANENT],
    ['no benefit group at all', undefined, EMPLOYMENT_TYPE_PERMANENT],
    ['a null benefit group', null, EMPLOYMENT_TYPE_PERMANENT],
  ])('reads %s as the right form of employment', (_label, benefitGroupId, expected) => {
    expect(employmentParameters(employment(benefitGroupId))).toEqual([{ key: EMPLOYMENT_TYPE_KEY, values: [expected] }]);
  });

  /** Utan känd anställning sätts ingen parameter: ett gissat värde vore ett obelagt påstående. */
  it('leaves the parameter out when the employment is unknown', () => {
    expect(employmentParameters(undefined)).toEqual([]);
  });
});
