'use client';
import type { WidgetProps } from '@rjsf/utils';
import { Textarea } from '@sk-web-gui/react';

import { getCommonProps, getWidgetOptions, requiredProps } from './types';

/**
 * Standardhöjden är 9,6rem, med manuell storleksändring upp till 60rem.
 * UI-schemats initialHeightRem sätts som inline-stil eftersom scheman från API:t
 * inte kan tillföra nya Tailwind-klasser efter att frontend har byggts.
 */
const DEFAULT_CLASS = 'w-full h-[9.6rem] min-h-[9.6rem] max-h-[60rem]';

export function TextareaWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const options = getWidgetOptions(props.options);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || options.placeholder;

  return (
    <Textarea
      id={id}
      className={className}
      style={options.initialHeightRem === undefined ? undefined : { height: `${options.initialHeightRem}rem` }}
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
