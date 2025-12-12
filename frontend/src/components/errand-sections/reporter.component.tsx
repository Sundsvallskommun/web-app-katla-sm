import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getEmployeeStakeholderFromApi } from '@services/employee-service/employee-service';
import { getReporterStakeholder } from '@utils/stakeholder';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const Reporter: React.FC = () => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<ErrandDTO>();
  const { stakeholders } = watch();

  if (!stakeholders && !getReporterStakeholder(stakeholders)) {
    getEmployeeStakeholderFromApi().then((res) => {
      const stakeholder: StakeholderDTO = { ...res, role: 'REPORTER' };
      setValue('stakeholders', [stakeholder]);
    });
  }

  return (
    <ErrandDisclosure header={t('errand-information:reporter.title')} lucideIconName="user">
      <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
        <span className="text-dark-secondary">{t('errand-information:reporter.description')}</span>
        <StakeholderCard type="reporter-card" stakeholder={getReporterStakeholder(stakeholders) ?? {}} />
      </div>
    </ErrandDisclosure>
  );
};
