'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Textarea } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions, requiredProps } from './types';

/**
 * Designens textruta: tre rader hög från början och dragbar ned till 600px. Höjden sätts här
 * i stället för med `rows`, eftersom både utgångsläget och gränserna kommer ur designen.
 */
const DEFAULT_CLASS = 'w-full h-[9.6rem] min-h-[9.6rem] max-h-[60rem]';

export function TextareaWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;

  return (
    <Textarea
      id={id}
      className={className}
      placeholder={placeholder}
      value={(value as string) ?? ''}
      disabled={disabled}
      readOnly={readonly}
      {...requiredProps(required)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        const val = e.currentTarget.value;
        onChange(val === '' ? undefined : val);
      }}
    />
  );
}
