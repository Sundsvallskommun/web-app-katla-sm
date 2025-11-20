import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { useTranslation } from 'react-i18next';

export const Reporter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:reporter.title')} lucideIconName="user">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
        <span className="text-dark-secondary">{t('errand-information:reporter.description')}</span>
        <StakeholderCard/>
      </div>
    </ErrandDisclosure>
  );
};
