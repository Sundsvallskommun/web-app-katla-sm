import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CancelErrandDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelErrandDialog: React.FC<CancelErrandDialogProps> = ({ show, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap<HTMLDialogElement>({ isActive: show });
  return (
    <Dialog
      purpose="form"
      ref={containerRef}
      isOpen={show}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={480}
    >
      <DialogHeader
        title={t('errand-information:cancel_confirm.title')}
        startContent={<CircleAlert size={24} aria-hidden="true" />}
      />
      <div className="px-5 pb-5">
        <p>{t('errand-information:cancel_confirm.description')}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-3 px-5 pb-5">
        <Button
          data-autofocus
          label={t('errand-information:cancel_confirm.back')}
          variant="secondary"
          onClick={onClose}
        />
        <Button label={t('errand-information:cancel_confirm.confirm')} variant="primary" onClick={onConfirm} />
      </div>
    </Dialog>
  );
};
