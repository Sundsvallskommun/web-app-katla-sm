import i18nConfig from '@app/i18nConfig';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { useToast } from '@astryxdesign/core/Toast';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import {
  errandFormDataContractErrorMessage,
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { SubmitErrandDialog } from '@components/submit-errand-dialog.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { getSelectedEventType } from '@utils/report-type';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { useWizardStore } from 'src/stores/wizard-store';

import { validateStep } from './wizard-step-validator';

export const WizardBottomBar: React.FC = () => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toast = useToast();
  const router = useRouter();
  const { getValues, reset, watch } = useFormContext<ErrandFormDTO>();
  const { setShowValidation, focusFirstError } = useFormValidation();
  const { currentStep, goNext, goBack, setStepErrors } = useWizardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { prepareErrandForApi, getFacilityStatus } = usePrepareErrand();

  const steps = useActiveWizardSteps();
  const errandId = watch('id');
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    try {
      const errandData = prepareErrandForApi(getValues(), 'DRAFT');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toast({ type: 'info', body: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });
      router.push(`/arende/${errand.errandNumber}/grundinformation`);
    } catch (error: unknown) {
      toast({
        type: 'error',
        body: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
    }
  };

  const onRegister = async () => {
    setIsOpen(false);
    try {
      const errandData = prepareErrandForApi(getValues(), 'NEW');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toast({
        type: 'info',
        body: t('errand-information:save_message.register'),
      });
      reset({ ...errand, errandFormData });
      // Kvittosidan, inte ärendet: rapportören är klar och ska inte landa i ett formulär
      // som inte längre går att ändra.
      router.push('/arende/inskickad');
    } catch (error: unknown) {
      toast({
        type: 'error',
        body: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
    }
  };

  // Felmeddelandet berättar vad som saknas och fokus flyttas till fältet, så att det går att
  // åtgärda direkt även när fältet ligger långt ner i steget.
  const reportValidationError = (message: string) => {
    toast({ type: 'error', body: message });
    focusFirstError();
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    const errors = await validateStep(step, getValues(), step.id === 'deviation' ? tForms : t, locale);
    setStepErrors(currentStep, errors);

    if (errors.length > 0) {
      setShowValidation(true);
      reportValidationError(errors[0]);
      return;
    }

    setShowValidation(false);
    goNext();
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    const values = getValues();
    const eventType = getSelectedEventType(values);
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

    if (!eventType) {
      reportValidationError(t('errand-information:about.event_type_required'));
      return;
    }
    if (!eventConcerns) {
      reportValidationError(t('errand-information:about.event_concerns_required'));
      return;
    }
    const formDataErrors = await validateErrandFormData(values.errandFormData, tForms, locale);
    if (formDataErrors.length > 0) {
      reportValidationError(formDataErrors[0]);
      return;
    }

    const facilityStatus = getFacilityStatus(values.errandFormData);
    if (eventConcerns === 'GRUPP_VERKSAMHET' && facilityStatus === 'NONE') {
      reportValidationError(t('errand-information:about.event_concerns_group_facility_required'));
      return;
    }
    // En plats som inte är vald hela vägen ner ger fel label, och därmed fel behörighet
    if (facilityStatus === 'INCOMPLETE') {
      reportValidationError(t('errand-information:about.facility_incomplete'));
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      <Stack direction="horizontal" align="center" gap={3} wrap="wrap">
        {!isFirstStep && (
          <Button
            label={t('errand-information:wizard.back')}
            size="lg"
            variant="secondary"
            icon={<ChevronLeft size={18} />}
            onClick={() => {
              setShowValidation(false);
              goBack();
            }}
            className="flex-1"
          />
        )}
        <Button
          label={t('errand-information:wizard.cancel')}
          size="lg"
          variant="secondary"
          onClick={() => {
            setIsCancelOpen(true);
          }}
          className="flex-1"
        />
        {draftEnabled && (
          <Button
            label={t('errand-information:wizard.save')}
            size="lg"
            variant="secondary"
            onClick={() => {
              void onSaveDraft();
            }}
            className="flex-1"
          />
        )}
        {isLastStep ?
          <Button
            label={t('errand-information:wizard.submit')}
            size="lg"
            variant="primary"

            onClick={() => {
              void handleSubmit();
            }}
            className="flex-1"
          />
        : <Button
            label={t('errand-information:wizard.next')}
            size="lg"
            variant="primary"

            endContent={<ChevronRight size={18} />}
            onClick={() => {
              void handleNext();
            }}
            className="flex-1"
          />
        }
      </Stack>

      <CancelErrandDialog
        show={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
        }}
        onConfirm={() => {
          router.push('/oversikt');
        }}
      />

      {/* Samma besked som på stor skärm, så att frågan lyder likadant var man än fyller i. */}
      <SubmitErrandDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={() => {
          void onRegister();
        }}
      />
    </>
  );
};
