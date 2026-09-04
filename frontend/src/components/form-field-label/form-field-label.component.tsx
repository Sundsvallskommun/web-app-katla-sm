'use client';

import { FormLabel, useFormControlContext } from '@sk-web-gui/react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

/** Gemensam märkning även för kontroller, som kryssrutor, som äger sin egen etikett. */
export function FieldRequirementIndicator({ required }: { required: boolean }) {
  const { t } = useTranslation('forms');

  return (
    <>
      {' '}
      <span className="font-normal text-dark-secondary whitespace-nowrap">
        {t(required ? 'required_label' : 'optional_label')}
      </span>
    </>
  );
}

/** FormControl äger obligatoriet; appen skriver ut det i text i stället för med en stjärna. */
export function FormFieldLabel({ children, ...props }: ComponentProps<typeof FormLabel> & { showRequired?: never }) {
  const formControl = useFormControlContext();

  return (
    <FormLabel {...props} showRequired={false}>
      {children}
      {formControl && <FieldRequirementIndicator required={!!formControl.required} />}
    </FormLabel>
  );
}
