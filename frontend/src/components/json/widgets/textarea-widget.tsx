'use client';
import { inputStatusFocusStyles, inputWrapperStyles } from '@astryxdesign/core/Field';
import type { WidgetProps } from '@rjsf/utils';
import * as stylex from '@stylexjs/stylex';

import styles from './schema-widgets.module.css';
import { getCommonProps, getWidgetOptions, requiredProps } from './types';

/**
 * Standardhöjden är 6rem, med manuell storleksändring upp till 37.5rem.
 * UI-schemats initialHeightRem sätts som inline-stil eftersom scheman från API:t
 * inte kan tillföra nya Tailwind-klasser efter att frontend har byggts.
 */
const DEFAULT_CLASS = 'w-full h-[6rem] min-h-[6rem] max-h-[37.5rem]';

export function TextareaWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const options = getWidgetOptions(props.options);
  const placeholder = (props.uiSchema?.['ui:placeholder'] ?? '') || options.placeholder;

  const appearance = stylex.props(
    inputWrapperStyles.base,
    disabled && inputWrapperStyles.disabled,
    invalid && inputStatusFocusStyles.error
  );

  return (
    <textarea
      {...appearance}
      id={id}
      className={`${appearance.className} ${styles.control} ${styles.textarea} ${className}`}
      style={options.initialHeightRem === undefined ? undefined : { height: `${options.initialHeightRem}rem` }}
      placeholder={placeholder}
      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
      disabled={disabled}
      readOnly={readonly}
      {...requiredProps(required)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      onBlur={onBlur}
      onFocus={(event) => {
        onFocus();
        // Native textarea focus may reveal only the caret. Keep the whole control
        // inside the form's scroll padding, clear of its persistent action footer.
        event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }}
      onChange={(e) => {
        const val = e.currentTarget.value;
        onChange(val === '' ? undefined : val);
      }}
    />
  );
}
