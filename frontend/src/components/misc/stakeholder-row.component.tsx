import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Layout';
import { ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getStakeholderRoleDisplayName, shouldShowContactDetails } from '@utils/stakeholder';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderRow: React.FC<{
  stakeholder: StakeholderDTO;
  onRemove?: () => void;
  roles?: string[];
  /** Avsnitt med en enda roll har redan rollens namn i rubriken. */
  hideRole?: boolean;
}> = ({ stakeholder, onRemove, roles, hideRole }) => {
  const { t } = useTranslation();
  const { metadata } = useMetadataStore();
  const isLocked = useIsContentLocked();
  const email = stakeholder.emails?.[0] ?? t('errand-information:stakeholder.missing_email');
  const phone = stakeholder.phoneNumbers?.[0] ?? t('errand-information:stakeholder.missing_phone');

  return (
    <ListItem
      data-cy="stakeholder-card"
      label={
        <Stack direction="vertical" gap={1} align="start">
          {!hideRole && (
            <Token data-cy="stakeholder-role" label={getStakeholderRoleDisplayName(stakeholder, metadata?.roles)} />
          )}
          <Text as="p" data-cy="stakeholder-name" weight="semibold" className="break-words">
            {stakeholder.firstName} {stakeholder.lastName}
          </Text>
        </Stack>
      }
      description={
        shouldShowContactDetails(roles) && (
          <Stack direction="vertical" gap={1} className="break-words">
            {stakeholder.title && (
              <Text as="p" type="supporting" data-cy="stakeholder-title">
                {stakeholder.title}
              </Text>
            )}
            {stakeholder.personNumber && !stakeholder.title && (
              <Text as="p" type="supporting" data-cy="stakeholder-personNumber">
                {stakeholder.personNumber}
              </Text>
            )}
            {stakeholder.department ?
              <Text as="p" type="supporting" data-cy="stakeholder-department">
                {stakeholder.department}
              </Text>
            : (Boolean(stakeholder.address) || Boolean(stakeholder.city)) && (
                <Text as="p" type="supporting" data-cy="stakeholder-address">
                  {stakeholder.address} {stakeholder.city}
                </Text>
              )
            }
            {email && (
              <Text as="p" type="supporting" data-cy="stakeholder-email">
                {email}
              </Text>
            )}
            {phone && (
              <Text as="p" type="supporting" data-cy="stakeholder-phonenumber">
                {phone}
              </Text>
            )}
          </Stack>
        )
      }
      endContent={
        onRemove && !isLocked ?
          <Button
            data-cy="remove-card-button"
            icon={<X size={16} aria-hidden="true" />}
            variant="secondary"
            onClick={onRemove}
            label={t('errand-information:stakeholder.remove')}
          />
        : undefined
      }
    />
  );
};
