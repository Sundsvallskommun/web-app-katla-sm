import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { useTranslation } from 'react-i18next';

interface SubmitErrandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Samma beslut och namngivning för desktopformuläret och mobilens sista steg. */
export const SubmitErrandDialog = ({ isOpen, onOpenChange, onConfirm }: SubmitErrandDialogProps) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: isOpen });

  return (
    <Dialog purpose="form" ref={containerRef} isOpen={isOpen} onOpenChange={onOpenChange} width={480}>
      <DialogHeader title={t('errand-information:submit_confirm.title')} />
      <div className="px-5 pb-5">
        <p>{t('errand-information:submit_confirm.question')}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-3 px-5 pb-5">
        <Button
          data-autofocus
          label={t('errand-information:cancel')}
          variant="secondary"
          onClick={() => {
            onOpenChange(false);
          }}
        />
        <Button
          data-cy="submit-button"
          label={t('errand-information:submit_confirm.submit')}
          variant="primary"
          onClick={onConfirm}
        />
      </div>
    </Dialog>
  );
};
