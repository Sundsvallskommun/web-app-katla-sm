'use client';
import { FieldRequirementIndicator } from '@components/form-field-label/form-field-label.component';
import type { WidgetProps } from '@rjsf/utils';

import styles from './schema-widgets.module.css';
import { getCommonProps } from './types';

const DEFAULT_CLASS = 'w-full';

export function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    required,
    invalid,
    describedBy,
    label,
    hideLabel,
    className,
    onChange,
    onBlur,
    onFocus,
  } = getCommonProps(props, DEFAULT_CLASS);

  return (
    <div className={className}>
      <label htmlFor={id} className={styles.choiceLabel}>
        <input
          type="checkbox"
          className={styles.choice}
          id={id}
          checked={!!value}
          disabled={disabled || readonly}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={(e) => {
            onChange(e.currentTarget.checked);
          }}
        />
        <span className={hideLabel ? 'sr-only' : undefined}>
          {label}
          <FieldRequirementIndicator required={required} />
        </span>
      </label>
    </div>
  );
}
