import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import { isRadioWidgetName } from '@components/json/widgets/radio-widget-names';
import { descriptionId, errorId, type FieldTemplateProps, titleId } from '@rjsf/utils';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { useTranslation } from 'react-i18next';

import { getFieldPresentation } from '../widgets/types';

export function FieldTemplate(props: FieldTemplateProps) {
  const { t } = useTranslation('forms');
  const { id, label, required, displayLabel, help, children, uiSchema, rawErrors, disabled, readonly } = props;

  const hideLabel = uiSchema?.['ui:options']?.hideLabel;
  const descriptionBelow = uiSchema?.['ui:options']?.descriptionBelow;
  const classNameOption = uiSchema?.['ui:options']?.className;
  const className = typeof classNameOption === 'string' ? classNameOption : undefined;
  const isHiddenWidget = uiSchema?.['ui:widget'] === 'hidden';

  if (isHiddenWidget) {
    return <>{children}</>;
  }

  const {
    description: sanitizedDescription,
    showDescription,
    newTabAnnouncementId,
    hasError,
    ownsField,
    describedBy,
  } = getFieldPresentation(props);
  const formControlClassName =
    className ? `form-row flex flex-col gap-2 ${className}` : 'form-row flex flex-col gap-2 w-full';
  const isRadioGroup = isRadioWidgetName(uiSchema?.['ui:widget']);
  // Märker fältet så att felnavigeringen hittar det, oavsett var i formuläret det ligger.
  const invalidFieldProps = hasError ? { [INVALID_FIELD_ATTRIBUTE]: id } : {};

  const renderDescription = (position: 'above' | 'below') => {
    if (!showDescription) return null;
    // Ovanför fältet sitter hjälptexten i etikettblocket, som äger avståndet ned till fältet.
    const marginClass = position === 'above' ? '' : 'mt-2';
    return (
      <>
        <div
          id={descriptionId(id)}
          className={`text-sm text-muted ${marginClass} [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`}
          dangerouslySetInnerHTML={{ __html: sanitizedDescription.html }}
        />
        {sanitizedDescription.hasNewTabLink && (
          <span id={newTabAnnouncementId} className="sr-only">
            {t('field_description.new_tab_announcement')}
          </span>
        )}
      </>
    );
  };

  const labelElement =
    displayLabel && !ownsField ?
      <FormFieldLabel
        id={titleId(id)}
        required={required}
        {...(isRadioGroup ? { as: 'legend' } : { htmlFor: id })}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
      </FormFieldLabel>
    : null;

  const fieldContent = (
    <>
      {/* En legend namnger sin fieldset bara som dess första barn, så radiogruppen får inget
          omslag. Övriga fält samlar etikett och hjälptext i ett block med jämnt avstånd ned till
          fältet, oavsett om hjälptexten finns. Klassen är också hållpunkten för rader som ställer
          sina fält i linje – se NARROW_ROW_FIELD_CLASS i ObjectFieldTemplate. */}
      {isRadioGroup ?
        <>
          {labelElement}
          {!descriptionBelow && renderDescription('above')}
        </>
      : <div className="field-label-block flex flex-col gap-2">
          {labelElement}
          {!descriptionBelow && renderDescription('above')}
        </div>
      }

      {children}

      {descriptionBelow && renderDescription('below')}

      {hasError && !ownsField && (
        <FieldStatus id={errorId(id)} type="error" message={rawErrors?.[0] ?? ''} variant="detached" />
      )}

      {help}
    </>
  );

  if (isRadioGroup) {
    return (
      <div className={formControlClassName} {...invalidFieldProps}>
        <fieldset
          id={id}
          className="m-0 min-w-0 w-full border-0 p-0"
          disabled={disabled || readonly}
          aria-describedby={describedBy}
          aria-invalid={hasError}
        >
          {fieldContent}
        </fieldset>
      </div>
    );
  }

  return (
    <div
      className={formControlClassName}
      {...invalidFieldProps}
      role={ownsField ? 'group' : undefined}
      aria-label={ownsField ? label : undefined}
      aria-describedby={ownsField ? describedBy : undefined}
    >
      {fieldContent}
    </div>
  );
}
