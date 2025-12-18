import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Spinner } from '@sk-web-gui/react';
import { getReporterStakeholder } from '@utils/stakeholder';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const Reporter: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<ErrandDTO>();
  const { stakeholders } = watch();

  return (
    <ErrandDisclosure header={t('errand-information:reporter.title')} lucideIconName="user">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
        <span className="text-dark-secondary">{t('errand-information:reporter.description')}</span>
        {getReporterStakeholder(stakeholders) ?
          <StakeholderCard stakeholder={getReporterStakeholder(stakeholders) ?? {}} />
        : <Spinner />}
      </div>
    </ErrandDisclosure>
  );
};
