import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { createErrand, saveErrand } from '@services/errand-service/errand-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CenterDiv } from './center-div.component';

//TODO: Adjust dialog text

export const ErrandButtonGroup: React.FC = () => {
  const { t } = useTranslation();
  const toastMessage = useSnackbar();
  const router = useRouter();
  const context = useFormContext<ErrandDTO>();
  const { handleSubmit, getValues, setValue, trigger, reset } = context;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const onSaveDraft = async () => {
    const isValid = await trigger(['classification.category', 'classification.type']);
    if (!isValid) return;
    const values = getValues();
    const apiCall = values.id ? saveErrand : createErrand;

    const errand = await apiCall(values)
      .then((res) => {
        toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
        return res;
      })
      .catch((res) => {
        toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
        return res;
      });

    reset(errand);

    router.push(`/arende/${errand.errandNumber}/grundinformation`);
    setIsOpen(false);
  };

  const onRegister = async (logout?: boolean) => {
    setValue('status', 'NEW');
    const values = getValues();
    const apiCall = values.id ? saveErrand : createErrand;

    const errand = await apiCall(values)
      .then((res) => {
        return res;
      })
      .catch((res) => {
        toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
        return res;
      });
    reset(errand);

    if (logout) {
      router.push('/logout');
    } else {
      router.push(`/arende/${errand.errandNumber}/grundinformation`);
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-row gap-[1.8rem]">
      <Button variant="secondary" onClick={() => window.close()}>
        {t('errand-information:cancel')}
      </Button>
      <Button data-cy="save-draft-errand" variant="primary" onClick={() => onSaveDraft()}>
        {t('errand-information:save_draft')}
      </Button>
      <Button data-cy="register-errand" variant="primary" color="vattjom" onClick={handleSubmit(() => setIsOpen(true))}>
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
