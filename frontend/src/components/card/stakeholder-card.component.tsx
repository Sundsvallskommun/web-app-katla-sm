import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button } from '@sk-web-gui/react';
import { useState } from 'react';

// TODO: Refactor type prop

export const StakeholderCard: React.FC<{
  stakeholder: StakeholderDTO;
  isEditable?: boolean;
  onRemove?: () => void;
  index?: number;
  type?: string;
}> = ({ stakeholder, isEditable, onRemove, index, type }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div data-cy={type ?? ''}>
      <div className="border-1 rounded-12 bg-background-content w-full max-w-[52.5rem] my-15">
        <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center mb-[1.5rem]">
          <strong className="px-[1rem]">{stakeholder.role}</strong>
        </div>
        <div className="px-[1rem]">
          <p className="text-[1.6rem] font-semibold">
            {stakeholder.firstName} {stakeholder.lastName}
          </p>
          <div className="flex text-md mb-10 flex-row">
            <div className="flex flex-col mr-10">
              <div>stakeholder.personid</div>
              <div className="italic text-text-secondary">
                {stakeholder.address} {stakeholder.city}
              </div>
            </div>

            <div className="flex flex-col">
              <div>
                {stakeholder.contactChannels?.find((c) => c.type?.includes('EMAIL'))?.value ?? 'Epostadress saknas'}
              </div>
              <div className="">
                {stakeholder.contactChannels?.find((c) => c.type?.includes('PHONE'))?.value ?? 'Telefonnummber saknas'}
              </div>
            </div>
          </div>

          {isEditable && (
            <div className="flex flex-col sm:flex-row gap-[1rem] mb-10">
              <Button
                data-cy="edit-card-button"
                leftIcon={<LucideIcon name="pen" size={16} />}
                variant="tertiary"
                size="sm"
                onClick={() => setIsOpen(true)}
              >
                Redigera uppgifter
              </Button>
              <Button
                data-cy="remove-card-button"
                leftIcon={<LucideIcon name="x" size={16} />}
                variant="tertiary"
                size="sm"
                onClick={onRemove}
              >
                Ta bort
              </Button>
            </div>
          )}
        </div>
      </div>
      <StakeholderFormModal
        edit
        index={index}
        initialValues={stakeholder}
        show={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};
