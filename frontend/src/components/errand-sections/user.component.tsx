import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { USER_FIELD_ID } from '@components/errand-sections/section-field-ids';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { useTranslation } from 'react-i18next';

export const UserContent: React.FC = () => {
  return (
    <div className="flex flex-col gap-32">
      <StakeholderList roles={['PRIMARY']} hideRoleSelect sectionCards fieldId={USER_FIELD_ID} />
    </div>
  );
};

export const User: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandSection header={t('errand-information:user.title')} description={t('errand-information:user.description')}>
      <UserContent />
    </ErrandSection>
  );
};
