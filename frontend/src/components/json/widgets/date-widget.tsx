'use client';
import { inputStatusFocusStyles, inputWrapperStyles } from '@astryxdesign/core/Field';
import type { WidgetProps } from '@rjsf/utils';
import * as stylex from '@stylexjs/stylex';

import styles from './schema-widgets.module.css';
import { getCommonProps, getWidgetOptions, requiredProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function DateWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || getWidgetOptions(props.options).placeholder;
  const max = typeof props.schema.formatMaximum === 'string' ? props.schema.formatMaximum : undefined;

  const appearance = stylex.props(
    inputWrapperStyles.base,
    disabled && inputWrapperStyles.disabled,
    invalid && inputStatusFocusStyles.error
  );

  return (
    <input
      {...appearance}
      className={`${appearance.className} ${styles.control} ${className}`}
      id={id}
      type="date"
      placeholder={placeholder}
      max={max ?? '9999-12-31'}
      value={typeof value === 'string' ? value : ''}
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
