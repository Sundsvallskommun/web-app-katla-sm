import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { useTranslation } from 'react-i18next';

export const UserContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <span className="text-dark-secondary">{t('errand-information:user.description')}</span>
      <StakeholderList roles={['PRIMARY']} hideRoleSelect />
    </div>
  );
};

export const User: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandSection header={t('errand-information:user.title')}>
      <UserContent />
    </ErrandSection>
  );
};
