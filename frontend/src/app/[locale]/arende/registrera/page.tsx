'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { SequenceOfEvents } from '@components/errand-sections/sequence-of-events.component';
import { User } from '@components/errand-sections/user.component';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getEmployeeStakeholderFromApi } from '@services/employee-service/employee-service';
import { useUserStore } from '@services/user-service/user-service';
import { getReporterStakeholder, phoneNumberFormatter } from '@utils/stakeholder';
import { useFormContext } from 'react-hook-form';

const Registrera: React.FC = () => {
  const { watch, setValue } = useFormContext<ErrandDTO>();
  const { stakeholders } = watch();
  const user = useUserStore((s) => s.user);

  if (!getReporterStakeholder(stakeholders) && user.username !== '') {
    getEmployeeStakeholderFromApi(user.username).then((res) => {
      const stakeholder: StakeholderDTO = {
        ...res.data,
        phoneNumbers: [phoneNumberFormatter(res.data.phoneNumbers?.[0])],
        role: 'REPORTER',
      };
      setValue('stakeholders', [...(stakeholders ?? []), stakeholder]);
    });
  }

  return (
    <div className="flex flex-col gap-32">
      <h2 className="text-h2-md text-dark-primary">1. Grundinformation</h2>
      <AboutErrand />
      <Reporter />
      <User />
      <OtherParties />
      <h2 className="text-h2-md text-dark-primary">2. Ärendeuppgifter</h2>
      <DeviationInformation />
      <SequenceOfEvents />
    </div>
  );
};

export default Registrera;
