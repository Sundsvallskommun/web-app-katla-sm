import {
  errandFormDataToJsonParameters,
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@app/[locale]/arende/layout';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CenterDiv } from './center-div.component';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const { t: tForms } = useTranslation('forms');
  const toastMessage = useSnackbar();
  const router = useRouter();
  const context = useFormContext<ErrandFormDTO>();
  const { getValues, trigger, reset, watch } = context;
  const { setShowValidation } = useFormValidation();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const errandStatus = watch('status');
  const errandId = watch('id');

  const isDraft = errandStatus === 'DRAFT';
  const showButtons = isNewErrand || isDraft;

  const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
    const { errandFormData, ...errandWithoutFormData } = values;
    return {
      ...errandWithoutFormData,
      status,
      jsonParameters: errandFormDataToJsonParameters(errandFormData),
    };
  };

  const onSaveDraft = async () => {
    const isValid = await trigger(['classification.category', 'classification.type']);
    if (!isValid) return;

    const errandData = prepareErrandForApi(getValues(), 'DRAFT');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });

      if (isNewErrand) {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  const onRegister = async (logout?: boolean) => {
    setIsOpen(false);

    const errandData = prepareErrandForApi(getValues(), 'NEW');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.register') });
      reset({ ...errand, errandFormData });

      if (logout) {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/logout`);
      } else {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row gap-[1.8rem]">
      {isNewErrand && (
        <Button variant="secondary" onClick={() => window.close()}>
          {t('errand-information:cancel')}
        </Button>
      )}
      <Button data-cy="save-draft-errand" variant="primary" onClick={() => onSaveDraft()}>
        {t('errand-information:save_draft')}
      </Button>
      <Button
        data-cy="register-errand"
        variant="primary"
        color="vattjom"
        onClick={async () => {
          // Aktivera validering för JSON-formulär
          setShowValidation(true);

          // Validera classification först
          const isClassificationValid = await trigger(['classification.category', 'classification.type']);

          // Validera errandFormData
          const values = getValues();
          const formDataErrors = await validateErrandFormData(values.errandFormData, tForms);

          if (!isClassificationValid || formDataErrors.length > 0) {
            return;
          }

          setIsOpen(true);
        }}
      >
        {t('errand-information:register')}
      </Button>
      <Dialog show={isOpen}>
        <Dialog.Content className="-mt-20">
          <CenterDiv>
            <LucideIcon size={32} name="inbox" color="vattjom" className="mb-[1.6rem]" />
            <h3 className="text-h3-md">{t('errand-information:register')}</h3>
            <span className="text-dark-secondary text-md mb-30">
              När du skickar in ett ärende. Lorem ipsum dolor sit amet consectuer
            </span>
            <span className="text-dark-secondary text-md">Vill du skicka in ärendet?</span>
          </CenterDiv>
        </Dialog.Content>

        <Dialog.Buttons className="justify-center">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Nej
          </Button>
          <Button variant="primary" onClick={() => onRegister()}>
            Skicka in
          </Button>
          <Button variant="primary" color="vattjom" onClick={() => onRegister(true)}>
            Skicka in och logga ut
          </Button>
        </Dialog.Buttons>
      </Dialog>
    </div>
  );
};
