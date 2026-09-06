'use client';
import { inputStatusFocusStyles, inputWrapperStyles } from '@astryxdesign/core/Field';
import type { WidgetProps } from '@rjsf/utils';
import * as stylex from '@stylexjs/stylex';

import styles from './schema-widgets.module.css';
import { getCommonProps, getWidgetOptions, requiredProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function SelectWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const { enumOptions = [] } = getWidgetOptions(props.options);

  const currentValue = value ?? '';

  const appearance = stylex.props(
    inputWrapperStyles.base,
    (disabled || readonly) && inputWrapperStyles.disabled,
    invalid && inputStatusFocusStyles.error
  );

  return (
    <select
      {...appearance}
      className={`${appearance.className} ${styles.control} ${styles.select} ${className}`}
      id={id}
      value={currentValue as string | number}
      onChange={(e) => {
        onChange(e.currentTarget.value || undefined);
      }}
      disabled={disabled || readonly}
      aria-readonly={readonly}
      {...requiredProps(required)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      {enumOptions.map((option) => (
        <option key={String(option.value)} value={option.value as string | number}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
