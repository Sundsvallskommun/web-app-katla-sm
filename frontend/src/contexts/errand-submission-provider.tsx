import i18nConfig from '@app/i18nConfig';
import { useToast } from '@astryxdesign/core/Toast';
import {
  errandFormDataContractErrorMessage,
  jsonParametersToErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { usePrepareErrand } from '@hooks/use-prepare-errand';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { useRouter } from 'next/navigation';
import { ReactNode, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { initializeErrandFormData } from 'src/flows/errand-forms';
import { validateErrand } from 'src/flows/validate-errand';

import { ErrandSubmissionContext } from './errand-submission-context';

/** Owns validation, the write lifecycle, feedback and navigation for both form presentations. */
export function ErrandSubmissionProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const { getValues, reset } = useFormContext<ErrandFormDTO>();
  const { setShowValidation, setErrors } = useFormValidation();
  const { prepareErrandForApi, getClassification } = usePrepareErrand();
  const toast = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const pending = useRef(false);

  const validate = async () => {
    if (!appConfig.katla) throw new Error('Errand submission requires a Katla.');
    setShowValidation(true);
    const values = getValues();
    const errors = await validateErrand(
      values,
      appConfig.katla,
      t,
      tForms,
      i18n.resolvedLanguage ?? i18nConfig.defaultLocale,
      getClassification(values).facilityStatus,
      getClassification(values).reportTypeConfigured
    );
    setErrors(errors);
    return errors;
  };

  const save = async (status: 'DRAFT' | 'NEW') => {
    if (pending.current) return;
    pending.current = true;
    setIsSaving(true);
    try {
      if (status === 'NEW' && (await validate()).length) return;
      if (!appConfig.katla) throw new Error('Errand submission requires a Katla.');
      const initialized = await initializeErrandFormData(
        getValues(),
        appConfig.katla,
        tForms,
        i18n.resolvedLanguage ?? i18nConfig.defaultLocale
      );
      const current = getValues();
      const values = {
        ...current,
        errandFormData: initialized.map(
          (entry) => current.errandFormData?.find((latest) => latest.schemaName === entry.schemaName) ?? entry
        ),
      };
      const payload = prepareErrandForApi(values, status);
      const errand = await (values.id ? updateErrand(values.id, payload) : createErrand(payload));
      reset({ ...errand, errandFormData: jsonParametersToErrandFormData(errand.jsonParameters) });
      toast({
        type: 'info',
        body: t(
          status === 'NEW' ? 'errand-information:save_message.register' : 'errand-information:save_message.draft'
        ),
      });
      router.push(status === 'NEW' ? '/arende/inskickad' : `/arende/${errand.errandNumber}/grundinformation`);
    } catch (error: unknown) {
      toast({
        type: 'error',
        body: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
    } finally {
      pending.current = false;
      setIsSaving(false);
    }
  };
  return (
    <ErrandSubmissionContext.Provider value={{ validate, save, isSaving }}>{children}</ErrandSubmissionContext.Provider>
  );
}
