'use client';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { Selector } from '@astryxdesign/core/Selector';
import type { WidgetProps } from '@rjsf/utils';
import { useTranslation } from 'react-i18next';

import { getCommonProps, getWidgetOptions } from './types';

/** RJSF äger värdena; Astryx äger sökning, tangentbord, fokus och felpresentation. */
export function ComboboxWidget(props: WidgetProps) {
  const { t } = useTranslation('forms');
  const { id, value, disabled, readonly, required, invalid, label, hideLabel, className, onChange, onBlur, onFocus } =
    getCommonProps(props, 'w-full');
  const { enumOptions = [], placeholder: customPlaceholder, multiple: optMultiple } = getWidgetOptions(props.options);
  const multiple = optMultiple ?? props.schema.type === 'array';
  const options = enumOptions.map((option) => ({ value: String(option.value), label: option.label }));
  const common = {
    id,
    label,
    isLabelHidden: hideLabel,
    isRequired: required,
    isOptional: !required,
    isDisabled: disabled || readonly,
    className,
    width: '100%',
    hasSearch: true,
    placeholder: (customPlaceholder ?? '') || t('combobox_placeholder'),
    options,
    onBlur,
    onFocus,
    status: invalid ? { type: 'error' as const, message: props.rawErrors?.[0] } : undefined,
    statusVariant: 'detached' as const,
  };
  if (multiple) {
    const currentValue =
      Array.isArray(value) ? value.map(String)
      : typeof value === 'string' || typeof value === 'number' ? [String(value)]
      : [];
    return (
      <MultiSelector
        {...common}
        value={currentValue}
        triggerDisplay="labels"
        hasClear
        onChange={(values) => {
          onChange(values.filter((item) => item !== ''));
        }}
      />
    );
  }
  return (
    <Selector
      {...common}
      value={typeof value === 'string' ? value : ''}
      onChange={(selected) => {
        onChange(selected);
      }}
    />
  );
}
