import i18nConfig from '@app/i18nConfig';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { useToast } from '@astryxdesign/core/Toast';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import { SubmitErrandDialog } from '@components/submit-errand-dialog.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { useErrandSubmission } from '@hooks/use-errand-submission';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

import { validateStep } from './wizard-step-validator';

export const WizardBottomBar: React.FC = () => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toast = useToast();
  const router = useRouter();
  const { getValues } = useFormContext<ErrandFormDTO>();
  const { setShowValidation, focusFirstError } = useFormValidation();
  const { currentStep, goNext, goBack, setStepErrors } = useWizardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { validate, save, isSaving } = useErrandSubmission();
  const steps = useActiveWizardSteps();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const draftEnabled = appConfig.features.draftEnabled;
  const onSaveDraft = () => save('DRAFT');
  const onRegister = async () => {
    setIsOpen(false);
    await save('NEW');
  };

  // Felmeddelandet berättar vad som saknas och fokus flyttas till fältet, så att det går att
  // åtgärda direkt även när fältet ligger långt ner i steget.
  const reportValidationError = (message: string) => {
    toast({ type: 'error', body: message });
    focusFirstError();
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    const errors = await validateStep(
      step,
      getValues(),
      ['deviation', 'details'].includes(step.id) ? tForms : t,
      locale
    );
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
    const errors = await validate();
    if (errors.length) {
      reportValidationError(errors[0].message);
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
            isDisabled={isSaving}
            variant="ghost"
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
          isDisabled={isSaving}
          variant="ghost"
          onClick={() => {
            setIsCancelOpen(true);
          }}
          className="flex-1"
        />
        {draftEnabled && (
          <Button
            label={t('errand-information:wizard.save')}
            size="lg"
            isDisabled={isSaving}
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
            isDisabled={isSaving}
            variant="primary"

            onClick={() => {
              void handleSubmit();
            }}
            className="flex-1"
          />
        : <Button
            label={t('errand-information:wizard.next')}
            size="lg"
            isDisabled={isSaving}
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
