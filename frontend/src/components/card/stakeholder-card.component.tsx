import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getStakeholderRoleDisplayName, shouldShowContactDetails } from '@utils/stakeholder';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderCard: React.FC<{
  stakeholder: StakeholderDTO;
  onRemove?: () => void;
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
}> = ({ stakeholder, onRemove, roles, hideRole, wide, children }) => {
  const { t } = useTranslation();
  const { metadata } = useMetadataStore();
  const isLocked = useIsContentLocked();

  return (
    // Kortet och dialogen hör ihop, men bara kortet ska räknas när de ligger i ett flexflöde:
    // som två syskon lade avsnittets gap ett tomrum efter kortet, där dialogen står osynlig.
    <div className="w-full">
      <Card data-cy="stakeholder-card" padding={5} width="100%" maxWidth={wide ? undefined : 525}>
        {!hideRole && (
          <div className="mb-3">
            <Badge data-cy="stakeholder-role" label={getStakeholderRoleDisplayName(stakeholder, metadata?.roles)} />
          </div>
        )}
        <div>
          <p data-cy="stakeholder-name" className="text-base font-semibold break-words mb-2">
            {stakeholder.firstName} {stakeholder.lastName}
          </p>

          {shouldShowContactDetails(roles) && (
            // Kolumnerna staplas på smal skärm; break-words ärvs ned så att långa
            // e-postadresser bryts i stället för att tvinga fram sidbredd.
            <div className="flex text-sm flex-col sm:flex-row gap-2 break-words">
              <div className={clsx('flex flex-col gap-2 min-w-0', wide && 'flex-1')}>
                {stakeholder.title && (
                  <div data-cy="stakeholder-title" className="mr-2.5">
                    {stakeholder.title}
                  </div>
                )}
                {stakeholder.personNumber && !stakeholder.title && (
                  <div data-cy="stakeholder-personNumber" className="mr-2.5">
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
              <div className={clsx('flex flex-col gap-2 min-w-0', wide && 'flex-1')}>
                <div data-cy="stakeholder-email">
                  {stakeholder.emails?.[0] ?? t('errand-information:stakeholder.missing_email')}
                </div>
                <div data-cy="stakeholder-phonenumber">
                  {stakeholder.phoneNumbers?.[0] ?? t('errand-information:stakeholder.missing_phone')}
                </div>
              </div>
            </div>
          )}

          {children && <div className="mt-4">{children}</div>}

          {onRemove && !isLocked && (
            <Button
              data-cy="remove-card-button"
              icon={<X size={16} aria-hidden="true" />}
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={onRemove}
              label={t('errand-information:stakeholder.remove')}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
