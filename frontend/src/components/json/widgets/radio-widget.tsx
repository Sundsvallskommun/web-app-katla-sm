'use client';
import { optionId, type WidgetProps } from '@rjsf/utils';

import styles from './schema-widgets.module.css';
import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full';

export function RadiobuttonWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, className, onChange, onBlur, onFocus } = getCommonProps(
    props,
    DEFAULT_CLASS
  );
  const { enumOptions = [] } = getWidgetOptions(props.options);

  return (
    <div className={`${className} flex flex-wrap gap-3`}>
      {enumOptions.map((option, index) => (
        <label key={String(option.value)} htmlFor={optionId(id, index)} className={styles.choiceLabel}>
          <input
            type="radio"
            className={styles.choice}
            id={optionId(id, index)}
            name={id}
            value={String(option.value)}
            checked={value === option.value}
            disabled={disabled || readonly}
            required={required}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={() => {
              onChange(option.value);
            }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
