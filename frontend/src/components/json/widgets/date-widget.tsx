'use client';
import type { WidgetProps } from '@rjsf/utils';
import { DatePicker } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions, requiredProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function DateWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;
  const max = typeof props.schema.formatMaximum === 'string' ? props.schema.formatMaximum : undefined;

  return (
    <DatePicker
      className={className}
      id={id}
      type="date"
      placeholder={placeholder}
      max={max}
      value={(value as string) ?? ''}
      disabled={disabled}
      readOnly={readonly}
      {...requiredProps(required)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
}
