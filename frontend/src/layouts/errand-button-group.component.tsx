import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import { SubmitErrandDialog } from '@components/submit-errand-dialog.component';
import { useErrandSubmission } from '@hooks/use-errand-submission';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { watch } = useFormContext<ErrandFormDTO>();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { validate, save, isSaving } = useErrandSubmission();
  const showButtons = isNewErrand || watch('status') === 'DRAFT';
  const draftEnabled = appConfig.features.draftEnabled;
  const onValidateBeforeRegister = async () => {
    if ((await validate()).length === 0) setIsOpen(true);
  };
  const onRegister = async () => {
    setIsOpen(false);
    await save('NEW');
  };
  const onSaveDraft = () => save('DRAFT');

  if (!showButtons) {
    return null;
  }

  return (
    <>
      <Stack direction="horizontal" align="center" gap={4} wrap="wrap">
        {isNewErrand && (
          <Button
            label={t('errand-information:cancel')}
            variant="ghost"
            onClick={() => {
              setIsCancelOpen(true);
            }}
          />
        )}
        {draftEnabled && (
          <Button
            label={t('errand-information:save_draft')}
            data-cy="save-draft-errand"
            isDisabled={isSaving}
            variant="primary"
            onClick={() => {
              void onSaveDraft();
            }}
          />
        )}
        <Button
          label={t('errand-information:register')}
          data-cy="register-errand"
          isDisabled={isSaving}
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
