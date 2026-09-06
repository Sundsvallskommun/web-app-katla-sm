'use client';
import { inputStatusFocusStyles, inputWrapperStyles } from '@astryxdesign/core/Field';
import type { WidgetProps } from '@rjsf/utils';
import * as stylex from '@stylexjs/stylex';

import styles from './schema-widgets.module.css';
import { getCommonProps, getWidgetOptions, requiredProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function TextWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;

  const appearance = stylex.props(
    inputWrapperStyles.base,
    disabled && inputWrapperStyles.disabled,
    invalid && inputStatusFocusStyles.error
  );

  return (
    <input
      {...appearance}
      id={id}
      className={`${appearance.className} ${styles.control} ${className}`}
      placeholder={placeholder}
      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
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
