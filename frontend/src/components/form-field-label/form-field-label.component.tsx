'use client';

import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

/** Gemensam märkning även för kontroller, som kryssrutor, som äger sin egen etikett. */
export function FieldRequirementIndicator({ required }: { required: boolean }) {
  const { t } = useTranslation('forms');

  return (
    <>
      {' '}
      <span className="font-normal text-muted whitespace-nowrap">
        {t(required ? 'required_label' : 'optional_label')}
      </span>
    </>
  );
}

/** Schemafält äger obligatoriet uttryckligen; etiketten har ingen bibliotekskontext. */
export function FormFieldLabel({
  children,
  as: Element = 'label',
  required,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'label' | 'legend'; htmlFor?: string; required?: boolean }) {
  return (
    <Element {...props} className={`text-sm font-semibold text-foreground ${className}`}>
      {children}
      {required !== undefined && <FieldRequirementIndicator required={required} />}
    </Element>
  );
}
