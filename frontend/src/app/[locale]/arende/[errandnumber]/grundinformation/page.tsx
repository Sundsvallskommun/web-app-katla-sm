'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { User } from '@components/errand-sections/user.component';
import { ErrandFormDTO } from '@app/[locale]/arende/layout';
import { getErrandUsingErrandNumber } from '@services/errand-service/errand-service';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

const Grundinformation: React.FC = () => {
  const context = useFormContext<ErrandFormDTO>();

  const pathName = usePathname();

  useEffect(() => {
    getErrandUsingErrandNumber(pathName?.split('/')[2]).then((res) => {
      const errandFormData = jsonParametersToErrandFormData(res.jsonParameters);
      context.reset({ ...res, errandFormData });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-32">
      <h2 className="text-h2-md text-dark-primary">1. Grundinformation</h2>
      <AboutErrand />
      <Reporter />
      <User />
      <OtherParties />
      <h2 className="text-h2-md text-dark-primary">2. Ärendeuppgifter</h2>
      <DeviationInformation />
    </div>
  );
};

export default Grundinformation;
