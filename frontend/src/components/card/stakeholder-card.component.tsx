import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button } from '@sk-web-gui/react';
import { getStakeholderRoleDisplayName } from '@utils/stakeholder';
import { useState } from 'react';
import { appConfig } from 'src/config/appconfig';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderCard: React.FC<{
  stakeholder: StakeholderDTO;
  isEditable?: boolean;
  onRemove?: () => void;
  index?: number;
  roles?: string[];
}> = ({ stakeholder, isEditable, onRemove, index, roles }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();

  return (
    <>
      <div
        data-cy="stakeholder-card"
        className="border-1 rounded-12 bg-background-content w-full max-w-[52.5rem] my-15"
      >
        <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center mb-[1.5rem]">
          <strong data-cy="stakeholder-role" className="px-[1rem]">
            {getStakeholderRoleDisplayName(stakeholder, metadata?.roles)}
          </strong>
        </div>
        <div className="px-[1rem]">
          <p data-cy="stakeholder-name" className="text-[1.6rem] font-semibold">
            {stakeholder.firstName} {stakeholder.lastName}
          </p>

          {!(roles?.includes('PRIMARY') && appConfig.features.reducedStakeholderInfo) && (
            <div className="flex text-md mb-10 flex-row gap-15">
              <div className="flex flex-col">
                {stakeholder.title && (
                  <div data-cy="stakeholder-title" className="mr-10">
                    {stakeholder.title}
                  </div>
                )}
                {stakeholder.personNumber && !stakeholder.title && (
                  <div data-cy="stakeholder-personNumber" className="mr-10">
                    {stakeholder.personNumber}
                  </div>
                )}
                {stakeholder.department ?
                  <div data-cy="stakeholder-department" className="">
                    {stakeholder.department}
                  </div>
                : <div data-cy="stakeholder-address">
                    {stakeholder.address} {stakeholder.city}
                  </div>
                }
              </div>
              <div className="flex flex-col">
                <div data-cy="stakeholder-email">{stakeholder.emails?.[0] ?? 'Epostadress saknas'}</div>
                <div data-cy="stakeholder-phonenumber">{stakeholder.phoneNumbers?.[0] ?? 'Telefonnummber saknas'}</div>
              </div>
            </div>
          )}

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
        roles={roles as string[]}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
