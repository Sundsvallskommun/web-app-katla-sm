import i18nConfig from '@app/i18nConfig';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Layout';
import { useToast } from '@astryxdesign/core/Toast';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import { COLLEAGUE_FIELD_ID, FACILITY_FIELD_ID, USER_FIELD_ID } from '@components/errand-sections/section-field-ids';
import {
  collectErrandFormDataErrors,
  errandFormDataContractErrorMessage,
  ErrandFormValidationError,
  jsonParametersToErrandFormData,
} from '@components/json/utils/schema-utils';
import { SubmitErrandDialog } from '@components/submit-errand-dialog.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';
import { getSelectedEventType } from '@utils/report-type';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

/** Rollerna en kollega kan ha när rapporten skrivs åt någon annan. */
const COLLEAGUE_ROLES = ['CONTACT', 'SUBSTITUTEASSIGNMENT'];

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toast = useToast();
  const router = useRouter();
  const context = useFormContext<ErrandFormDTO>();
  const { getValues, reset, watch } = context;
  const { setShowValidation, setErrors } = useFormValidation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const { prepareErrandForApi, getFacilityStatus } = usePrepareErrand();

  const errandStatus = watch('status');
  const errandId = watch('id');

  const isDraft = errandStatus === 'DRAFT';
  const showButtons = isNewErrand || isDraft;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    try {
      const errandData = prepareErrandForApi(getValues(), 'DRAFT');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toast({ type: 'info', body: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });

      if (isNewErrand) {
        router.push(`/arende/${errand.errandNumber}/grundinformation`);
      }
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
      toast({ type: 'info', body: t('errand-information:save_message.register') });
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

  /**
   * Allt som saknas samlas in i ett svep och visas i sammanfattningen överst. Tidigare stoppade
   * kontrollen vid första felet och rapporterade det i en toast, vilket krävde en inskickning per
   * fel innan man visste vad som återstod.
   *
   * Ordningen följer formuläret uppifrån och ner, så att raderna i sammanfattningen står i samma
   * ordning som fälten de pekar på.
   */
  const onValidateBeforeRegister = async () => {
    // Aktivera validering för JSON-formulär
    setShowValidation(true);

    const values = getValues();
    const eventType = getSelectedEventType(values);
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];
    const validationErrors: ErrandFormValidationError[] = [];

    if (!eventType) {
      validationErrors.push({ message: t('errand-information:about.event_type_required'), fieldId: 'event-type' });
    }
    if (!eventConcerns) {
      validationErrors.push({
        message: t('errand-information:about.event_concerns_required'),
        fieldId: 'event-concerns',
      });
    }

    // Ett utlovat men tomt avsnitt är inte samma sak som ett avsnitt man hoppat över: kryssrutan
    // och valet av vem rapporten berör lovar en person som ännu inte finns i ärendet.
    const stakeholders = values.stakeholders ?? [];
    if (values.reportingForColleague && !stakeholders.some((s) => COLLEAGUE_ROLES.includes(s.role ?? ''))) {
      validationErrors.push({
        message: t('errand-information:other_reporter.required'),
        fieldId: COLLEAGUE_FIELD_ID,
      });
    }
    if (eventConcerns === EVENT_CONCERNS_INDIVIDUAL && !stakeholders.some((s) => s.role === 'PRIMARY')) {
      validationErrors.push({ message: t('errand-information:user.required'), fieldId: USER_FIELD_ID });
    }

    // Validera errandFormData innan affärsregler läser värden ur JSON-strukturen.
    validationErrors.push(...(await collectErrandFormDataErrors(values.errandFormData, tForms, locale)));

    // En saknad plats fångas av schemat, som kräver den för alla rapporttyper. Kvar här är
    // bara det schemat inte kan se: att valet inte är fört hela vägen ner till en enhet.
    const facilityStatus = getFacilityStatus(values.errandFormData);
    // En plats som inte är vald hela vägen ner ger fel label, och därmed fel behörighet
    if (facilityStatus === 'INCOMPLETE') {
      validationErrors.push({ message: t('errand-information:about.facility_incomplete'), fieldId: FACILITY_FIELD_ID });
    }

    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      return;
    }

    setIsOpen(true);
  };

  if (!showButtons) {
    return null;
  }

  return (
    <>
      <Stack direction="horizontal" wrap="wrap" align="center" justify="end" gap={3}>
        {isNewErrand && (
          <Button
            label={t('errand-information:cancel')}
            variant="secondary"
            onClick={() => {
              setIsCancelOpen(true);
            }}
          />
        )}
        {draftEnabled && (
          <Button
            label={t('errand-information:save_draft')}
            data-cy="save-draft-errand"
            variant="secondary"
            onClick={() => {
              void onSaveDraft();
            }}
          />
        )}
        <Button
          label={t('errand-information:register')}
          data-cy="register-errand"
          variant="primary"

          onClick={() => {
            void onValidateBeforeRegister();
          }}
        />
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
      {/* Beskedet står vänsterställt som en fråga med sitt svar, inte som en centrerad notis:
          det är ett beslut som ska läsas innan knapparna, inte en bekräftelse i efterhand. */}
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
