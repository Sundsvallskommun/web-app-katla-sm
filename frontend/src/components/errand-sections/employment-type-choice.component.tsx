'use client';

import { ErrandFormDTO } from '@interfaces/errand-form';
import { FormControl, FormLabel, RadioButton } from '@sk-web-gui/react';
import {
  EMPLOYMENT_TYPE_PERMANENT,
  EMPLOYMENT_TYPE_SUBSTITUTE,
  getEmploymentType,
  withEmploymentType,
} from '@utils/stakeholder';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface EmploymentTypeChoiceProps {
  /** Partens plats i formulärets lista. Valet sparas på just den parten. */
  index: number;
  /** Skiljer radiogrupperna åt när både rapportören och kollegan visas på samma sida. */
  name: string;
}

/**
 * Anställningsform för en part. Värdet ligger som parameter på parten själv, så rapportören och
 * kollegan man rapporterar åt bär var sitt val. Tillsvidareanställd är förvalet.
 */
export const EmploymentTypeChoice: React.FC<EmploymentTypeChoiceProps> = ({ index, name }) => {
  const { t } = useTranslation();
  const { getValues, setValue, watch } = useFormContext<ErrandFormDTO>();
  const stakeholder = watch(`stakeholders.${index}`);
  const employmentType = getEmploymentType(stakeholder);

  const selectEmploymentType = (value: string) => {
    const stakeholders = getValues('stakeholders') ?? [];
    const current = stakeholders[index];
    if (!current) return;

    setValue(
      'stakeholders',
      stakeholders.map((candidate, candidateIndex) =>
        candidateIndex === index ? withEmploymentType(current, value) : candidate
      )
    );
  };

  return (
    <FormControl required id={`${name}-employment-type`}>
      <FormLabel>{t('errand-information:stakeholder.employment_type')}</FormLabel>
      <RadioButton.Group data-cy={`${name}-employment-type-group`} className="gap-16" inline>
        {[EMPLOYMENT_TYPE_PERMANENT, EMPLOYMENT_TYPE_SUBSTITUTE].map((value) => (
          <RadioButton
            key={value}
            name={`${name}-employment-type`}
            data-cy={`${name}-employment-type-${value.toLowerCase()}`}
            value={value}
            checked={employmentType === value}
            onChange={() => {
              selectEmploymentType(value);
            }}
          >
            {t(`errand-information:stakeholder.employment_type_${value.toLowerCase()}`)}
          </RadioButton>
        ))}
      </RadioButton.Group>
    </FormControl>
  );
};
