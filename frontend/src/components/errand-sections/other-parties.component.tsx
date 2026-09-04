import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { useTranslation } from 'react-i18next';

export const OtherPartiesContent: React.FC = () => {
  return (
    <div className="flex flex-col gap-32">
      <StakeholderList roles={['CONTACT']} employeeSearch hideRoleSelect />
    </div>
  );
};

export const OtherParties: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandSection
      header={t('errand-information:other_parties.title')}
      description={t('errand-information:other_parties.description')}
    >
      <OtherPartiesContent />
    </ErrandSection>
  );
};
