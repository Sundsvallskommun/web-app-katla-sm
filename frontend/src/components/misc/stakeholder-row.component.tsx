import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getStakeholderRoleDisplayName, phoneNumberFormatter, shouldShowContactDetails } from '@utils/stakeholder';
import { Mail, Phone, Trash2 } from 'lucide-react';
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
  const name = [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ').trim();
  const role = getStakeholderRoleDisplayName(stakeholder, metadata?.roles);
  const showContactDetails = shouldShowContactDetails(roles);
  // Contact links remain usable inside ErrandContentLock's disabled fieldset.
  // Only the links opt into pointer events and an enabled accessibility state.
  const email = stakeholder.emails?.[0];
  const phone = stakeholder.phoneNumbers?.[0];
  const identity = stakeholder.title?.length ? stakeholder.title : stakeholder.personNumber;
  const organization =
    stakeholder.department?.length ?
      stakeholder.department
    : [stakeholder.address, stakeholder.city].filter(Boolean).join(' ');

  return (
    <ListItem
      data-cy="stakeholder-card"
      // Links and removal are independent actions. Each control owns its focus ring;
      // the non-clickable row must not add Astryx Item's whole-row focus outline.
      className="!outline-0"
      label={
        <Stack direction="horizontal" align="start" wrap="wrap" gap={3}>
          <Stack gap={3} className="min-w-0 flex-1 basis-64">
            <Stack direction="horizontal" align="center" gap={3}>
              <Avatar name={name} size="md" tooltip={false} aria-hidden="true" data-cy="stakeholder-avatar" />
              <Stack gap={1} className="min-w-0 break-words">
                <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                  <Text as="p" data-cy="stakeholder-name" weight="semibold" className="min-w-0">
                    {name || t('errand-information:stakeholder.missing_name')}
                  </Text>
                  {!hideRole && role && <Token data-cy="stakeholder-role" label={role} />}
                </Stack>
                {showContactDetails && (Boolean(identity) || Boolean(organization)) && (
                  <Text as="p" type="supporting" color="secondary">
                    {identity && (
                      <Text
                        type="inherit"
                        color="inherit"
                        data-cy={stakeholder.title ? 'stakeholder-title' : 'stakeholder-personNumber'}
                      >
                        {identity}
                      </Text>
                    )}
                    {identity && organization && (
                      <Text type="inherit" color="inherit" aria-hidden="true">
                        {' · '}
                      </Text>
                    )}
                    {organization && (
                      <Text
                        type="inherit"
                        color="inherit"
                        data-cy={stakeholder.department ? 'stakeholder-department' : 'stakeholder-address'}
                      >
                        {organization}
                      </Text>
                    )}
                  </Text>
                )}
              </Stack>
            </Stack>
            {showContactDetails && (email !== '' || phone !== '') && (
              <Stack gap={2} className="break-words">
                {email !== '' && (
                  <Stack direction="horizontal" align="center" gap={2}>
                    <Mail size={16} aria-hidden="true" className="shrink-0 text-muted" />
                    {email ?
                      <Link
                        href={`mailto:${encodeURIComponent(email)}`}
                        type="supporting"
                        hasUnderline
                        color="primary"
                        aria-disabled={false}
                        className="min-w-0 min-h-6 break-all pointer-events-auto"
                        data-cy="stakeholder-email"
                      >
                        {email}
                      </Link>
                    : <Text type="supporting" color="secondary" data-cy="stakeholder-email">
                        {t('errand-information:stakeholder.missing_email')}
                      </Text>
                    }
                  </Stack>
                )}
                {phone !== '' && (
                  <Stack direction="horizontal" align="center" gap={2}>
                    <Phone size={16} aria-hidden="true" className="shrink-0 text-muted" />
                    {phone ?
                      <Link
                        href={`tel:${phoneNumberFormatter(phone)}`}
                        type="supporting"
                        hasUnderline
                        color="primary"
                        aria-disabled={false}
                        className="min-w-0 min-h-6 break-all pointer-events-auto"
                        data-cy="stakeholder-phonenumber"
                      >
                        {phone}
                      </Link>
                    : <Text type="supporting" color="secondary" data-cy="stakeholder-phonenumber">
                        {t('errand-information:stakeholder.missing_phone')}
                      </Text>
                    }
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
          {onRemove && !isLocked && (
            <Button
              data-cy="remove-card-button"
              icon={<Trash2 size={16} aria-hidden="true" />}
              variant="secondary"
              onClick={onRemove}
              label={t('errand-information:stakeholder.remove')}
              aria-label={name ? t('errand-information:stakeholder.remove_person', { name }) : undefined}
            />
          )}
        </Stack>
      }
    />
  );
};
