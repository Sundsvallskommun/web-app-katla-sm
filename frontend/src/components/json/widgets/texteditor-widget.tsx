'use client';
import { RichTextEditor } from '@components/rich-text-editor/rich-text-editor.component';
import type { WidgetProps } from '@rjsf/utils';

import { getCommonProps, getWidgetOptions } from './types';

const DEFAULT_CLASS = 'w-full h-[22rem]';

export function TexteditorWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, required, invalid, describedBy, className, onChange, onBlur, onFocus } =
    getCommonProps(props, DEFAULT_CLASS);
  const { disableToolbar } = getWidgetOptions(props.options);
  const showToolbar = disableToolbar === false;
  const markupValue = typeof value === 'string' ? value : '';

  return (
    <RichTextEditor
      id={id}
      labelledBy={`${id}__title`}
      describedBy={describedBy}
      invalid={invalid}
      disabled={disabled}
      required={required}
      name={id}
      className={className}
      disableToolbar={!showToolbar}
      readOnly={readonly}
      value={{ markup: markupValue }}
      onSelectionChange={(range, oldRange) => {
        if (range && !oldRange) {
          onFocus();
        }
        if (!range && oldRange) {
          onBlur();
        }
      }}
      onChange={(event) => {
        onChange(event.target.value.markup ?? '');
      }}
    />
  );
}
