import { validateErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { getAvvikelsePartyIssues } from '@katla/definitions/avvikelse';
import type { TFunction } from 'i18next';
import { appConfig } from 'src/config/appconfig';
import { getErrandSchemaNames } from 'src/flows/errand-forms';

import { WizardStep } from './wizard-steps';

/**
 * `t` är obligatorisk. Med en valfri parameter och svensk reservtext skulle en glömd
 * inkoppling ge svenska valideringsfel i ett engelskt gränssnitt, utan att vare sig
 * typkontroll eller test reagerar.
 */
export async function validateStep(
  step: WizardStep,
  formValues: ErrandFormDTO,
  t: TFunction,
  locale?: string
): Promise<string[]> {
  switch (step.id) {
    case 'about': {
      const errors: string[] = [];
      const issues = getAvvikelsePartyIssues(formValues);
      if (issues.includes('EVENT_TYPE_REQUIRED')) errors.push(t('errand-information:about.event_type_required'));
      if (issues.includes('EVENT_CONCERNS_REQUIRED'))
        errors.push(t('errand-information:about.event_concerns_required'));
      return errors;
    }

    case 'details':
    case 'deviation': {
      return validateErrandFormData(
        formValues.errandFormData,
        t,
        locale,
        appConfig.katla ? getErrandSchemaNames(formValues, appConfig.katla) : []
      );
    }

    case 'reporter':
    case 'user':
    case 'summary':
    default:
      return [];
  }
}
