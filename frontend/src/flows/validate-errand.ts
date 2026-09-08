import { COLLEAGUE_FIELD_ID, FACILITY_FIELD_ID, USER_FIELD_ID } from '@components/errand-sections/section-field-ids';
import {
  collectErrandFormDataErrors,
  ErrandFormValidationError,
  schemaFieldPrefix,
} from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { KatlaDefinition } from '@katla/definitions';
import { FACILITY_SCHEMA_NAME, FacilitySelectionStatus, getAvvikelsePartyIssues } from '@katla/definitions/avvikelse';
import { TFunction } from 'i18next';

import { getErrandSchemaNames } from './errand-forms';

/** One submission contract for desktop and mobile; drafts may be incomplete. */
export async function validateErrand(
  values: ErrandFormDTO,
  definition: KatlaDefinition,
  t: TFunction,
  tForms: TFunction,
  locale: string,
  facilityStatus: FacilitySelectionStatus,
  reportTypeConfigured: boolean
): Promise<ErrandFormValidationError[]> {
  const errors: ErrandFormValidationError[] = [];
  const requiredNames = getErrandSchemaNames(values, definition);
  const facilityFieldId =
    schemaFieldPrefix(FACILITY_SCHEMA_NAME, requiredNames) + FACILITY_FIELD_ID.slice('root'.length);
  const stakeholders = values.stakeholders ?? [];
  if (
    values.reportingForColleague &&
    !stakeholders.some((s) => ['CONTACT', 'SUBSTITUTEASSIGNMENT'].includes(s.role ?? ''))
  ) {
    errors.push({ message: t('errand-information:other_reporter.required'), fieldId: COLLEAGUE_FIELD_ID });
  }
  if (definition.flow === 'avvikelse') {
    for (const issue of getAvvikelsePartyIssues(values)) {
      switch (issue) {
        case 'EVENT_TYPE_REQUIRED':
          errors.push({ message: t('errand-information:about.event_type_required'), fieldId: 'event-type' });
          break;
        case 'EVENT_CONCERNS_REQUIRED':
          errors.push({ message: t('errand-information:about.event_concerns_required'), fieldId: 'event-concerns' });
          break;
        case 'PRIMARY_REQUIRED':
          errors.push({ message: t('errand-information:user.required'), fieldId: USER_FIELD_ID });
          break;
      }
    }
    if (!reportTypeConfigured) {
      errors.push({ message: t('errand-information:about.report_type_unavailable'), fieldId: 'event-type' });
    }
    if (facilityStatus === 'NONE') {
      errors.push({ message: t('errand-information:about.facility_required'), fieldId: facilityFieldId });
    }
    if (facilityStatus === 'INCOMPLETE') {
      errors.push({ message: t('errand-information:about.facility_incomplete'), fieldId: facilityFieldId });
    }
  }
  errors.push(...(await collectErrandFormDataErrors(values.errandFormData, tForms, locale, requiredNames)));
  return errors;
}
