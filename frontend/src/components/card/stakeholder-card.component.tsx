import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { Button, cx } from '@sk-web-gui/react';
import { getStakeholderRoleDisplayName, shouldShowContactDetails } from '@utils/stakeholder';
import { Pen, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderCard: React.FC<{
  stakeholder: StakeholderDTO;
  isEditable?: boolean;
  hideRemove?: boolean;
  editableFields?: (keyof StakeholderDTO)[];
  onRemove?: () => void;
  index?: number;
  roles?: string[];
  /**
   * Rollraden namnger vem kortet gäller när flera parter med olika roller står under samma
   * rubrik. Där avsnittet självt bara rymmer en roll upprepar den bara rubriken ovanför.
   */
  hideRole?: boolean;
  /** Kortet fyller avsnittets bredd i stället för att hålla läsbredd bland flera kort. */
  wide?: boolean;
  /** Innehåll som hör till just den här parten och står under uppgifterna, före knapparna. */
  children?: ReactNode;
}> = ({ stakeholder, isEditable, hideRemove, editableFields, onRemove, index, roles, hideRole, wide, children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();
  const isLocked = useIsContentLocked();

  return (
    // Kortet och dialogen hör ihop, men bara kortet ska räknas när de ligger i ett flexflöde:
    // som två syskon lade avsnittets gap ett tomrum efter kortet, där dialogen står osynlig.
    <div className="w-full">
      <div
        data-cy="stakeholder-card"
        className={cx('border-1 rounded-12 bg-background-content w-full', !wide && 'max-w-[52.5rem] my-15')}
      >
        {!hideRole && (
          <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center mb-[1.5rem]">
            <strong data-cy="stakeholder-role" className="px-[1rem]">
              {getStakeholderRoleDisplayName(stakeholder, metadata?.roles)}
            </strong>
          </div>
        )}
        <div className={cx('px-20', hideRole ? 'py-16' : 'pb-16')}>
          <p data-cy="stakeholder-name" className="text-[1.6rem] font-semibold break-words mb-8">
            {stakeholder.firstName} {stakeholder.lastName}
          </p>

          {shouldShowContactDetails(roles) && (
            // Kolumnerna staplas på smal skärm; break-words ärvs ned så att långa
            // e-postadresser bryts i stället för att tvinga fram sidbredd.
            <div className="flex text-md flex-col sm:flex-row gap-8 break-words">
              <div className={cx('flex flex-col gap-8 min-w-0', wide && 'flex-1')}>
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
              <div className={cx('flex flex-col gap-8 min-w-0', wide && 'flex-1')}>
                <div data-cy="stakeholder-email">
                  {stakeholder.emails?.[0] ?? t('errand-information:stakeholder.missing_email')}
                </div>
                <div data-cy="stakeholder-phonenumber">
                  {stakeholder.phoneNumbers?.[0] ?? t('errand-information:stakeholder.missing_phone')}
                </div>
              </div>
            </div>
          )}

          {children && <div className="mt-16">{children}</div>}

          {isEditable && !isLocked && (
            <div className="flex flex-col sm:flex-row gap-[1rem] mt-16">
              <Button
                data-cy="edit-card-button"
                leftIcon={<Pen size={16} />}
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                {t('errand-information:stakeholder.edit_details')}
              </Button>
              {!hideRemove && (
                <Button
                  data-cy="remove-card-button"
                  leftIcon={<X size={16} />}
                  variant="tertiary"
                  size="sm"
                  onClick={onRemove}
                >
                  {t('errand-information:stakeholder.remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <StakeholderFormModal
        edit
        index={index}
        initialValues={stakeholder}
        show={isOpen}
        roles={roles ?? []}
        editableFields={editableFields}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};
