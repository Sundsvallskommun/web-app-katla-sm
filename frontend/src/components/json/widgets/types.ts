import { descriptionId, errorId, getUiOptions, helpId, type WidgetProps } from '@rjsf/utils';

import { sanitizeFieldDescription } from '../fields/sanitize-field-description';

export interface EnumOption {
  value: string | number | boolean;
  label: string;
}

/**
 * Utökade alternativ som kan skickas via ui:options i schemat
 */
export interface WidgetOptions {
  className?: string;
  placeholder?: string;
  /** Starthöjd för textarea i rem. Fältets min- och maxhöjd gäller fortfarande. */
  initialHeightRem?: number;
  multiple?: boolean;
  disableToolbar?: boolean;
  enumOptions?: EnumOption[];
}

export function getWidgetOptions(options: WidgetProps['options']): WidgetOptions {
  const opts = (options ?? {}) as Record<string, unknown>;
  return {
    className: opts.className as string | undefined,
    placeholder: opts.placeholder as string | undefined,
    initialHeightRem:
      typeof opts.initialHeightRem === 'number' && Number.isFinite(opts.initialHeightRem) && opts.initialHeightRem > 0 ?
        opts.initialHeightRem
      : undefined,
    multiple: opts.multiple as boolean | undefined,
    disableToolbar: opts.disableToolbar as boolean | undefined,
    enumOptions: opts.enumOptions as EnumOption[] | undefined,
  };
}

/** Samma metadata styr vilka beskrivningar som ritas och vilka ARIA-referenser som används. */
export function getFieldPresentation({
  id,
  schema,
  uiSchema,
  rawErrors,
  hideError,
}: Pick<WidgetProps, 'id' | 'schema' | 'uiSchema' | 'rawErrors' | 'hideError'>) {
  const uiDescription = uiSchema?.['ui:description'];
  const descriptionText = typeof uiDescription === 'string' ? uiDescription : (schema.description ?? '');
  const newTabAnnouncementId = `${descriptionId(id)}__new-tab`;
  const description = sanitizeFieldDescription(descriptionText, newTabAnnouncementId);
  const showDescription = Boolean(description.html) && !uiSchema?.['ui:options']?.hideDescription;
  const hasError = !hideError && Boolean(rawErrors?.length);
  const ownsField = uiSchema?.['ui:widget'] === 'ComboboxWidget' || uiSchema?.['ui:widget'] === 'combobox';
  const describedBy =
    [
      showDescription ? descriptionId(id) : undefined,
      getUiOptions(uiSchema).help ? helpId(id) : undefined,
      hasError && !ownsField ? errorId(id) : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  return { description, showDescription, newTabAnnouncementId, hasError, ownsField, describedBy };
}

export interface CommonWidgetProps {
  id: string;
  value: unknown;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  describedBy?: string;
  label: string;
  hideLabel: boolean;
  className: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export function getCommonProps(props: WidgetProps, defaultClassName: string): CommonWidgetProps {
  const { id, disabled, readonly, required, label, hideLabel, onChange } = props;
  const value: unknown = props.value;
  const options = getWidgetOptions(props.options);
  const presentation = getFieldPresentation(props);

  return {
    id,
    value,
    disabled: !!disabled,
    readonly: !!readonly,
    required: !!required,
    invalid: presentation.hasError,
    describedBy: presentation.describedBy,
    label,
    hideLabel: !!hideLabel,
    className: (options.className ?? '') || defaultClassName,
    onChange,
    onBlur: () => {
      props.onBlur(id, value);
    },
    onFocus: () => {
      props.onFocus(id, value);
    },
  };
}

/** Schemat äger valideringen; ARIA märker obligatoriet utan webbläsarens tidiga :invalid. */
export const requiredProps = (required: boolean) => ({ required: false, 'aria-required': required });
