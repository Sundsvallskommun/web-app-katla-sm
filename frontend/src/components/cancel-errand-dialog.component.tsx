import { ModalLayer } from '@components/modal-layer/modal-layer.component';
import { CenterDiv } from '@layouts/center-div.component';
import { Button, Dialog } from '@sk-web-gui/react';
import { CircleAlert } from 'lucide-react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface CancelErrandDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelErrandDialog: React.FC<CancelErrandDialogProps> = ({ show, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const dialogId = useId();
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const title = t('errand-information:cancel_confirm.title');

  return (
    <ModalLayer id={dialogId} variant="dialog" show={show} onClose={onClose} initialFocus={backButtonRef} label={title}>
      <div className="sk-modal-dialog-header">
        <div className="sk-modal-dialog-header-title">
          <CenterDiv className="max-w-[32rem] mx-auto">
            <CircleAlert size={32} className="mb-[1.6rem] text-warning-surface-primary" aria-hidden="true" />
            <h3 className="text-h3-md text-dark-primary mb-0">{title}</h3>
          </CenterDiv>
        </div>
      </div>
      <Dialog.Content>
        <CenterDiv className="max-w-[32rem] mx-auto">
          <span className="text-dark-secondary text-md text-center">
            {t('errand-information:cancel_confirm.description')}
          </span>
        </CenterDiv>
      </Dialog.Content>
      <Dialog.Buttons className="justify-center">
        <Button ref={backButtonRef} variant="secondary" onClick={onClose}>
          {t('errand-information:cancel_confirm.back')}
        </Button>
        <Button variant="primary" color="vattjom" onClick={onConfirm}>
          {t('errand-information:cancel_confirm.confirm')}
        </Button>
      </Dialog.Buttons>
    </ModalLayer>
  );
};
