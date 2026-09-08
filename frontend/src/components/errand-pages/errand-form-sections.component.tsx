'use client';
import { ErrandErrorSummary } from '@components/errand-pages/errand-error-summary.component';
import { ErrandInformation } from '@components/errand-sections/errand-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { useActiveWizardSteps } from '@hooks/use-active-wizard-steps';
import { Fragment } from 'react';
import { appConfig } from 'src/config/appconfig';
import { AboutErrand } from 'src/flows/avvikelse/about-errand.component';
import { User } from 'src/flows/avvikelse/user.component';

/** Both screen sizes follow the same ordered sections and visibility rules. */
export const ErrandFormSections: React.FC = () => {
  const steps = useActiveWizardSteps();
  return (
    <>
      <ErrandErrorSummary />
      {steps.map((step) => {
        switch (step.id) {
          case 'reporter':
            return (
              <Fragment key={step.id}>
                <Reporter />
                {appConfig.features.otherPartiesDisclosure && <OtherParties />}
              </Fragment>
            );
          case 'about':
            return <AboutErrand key={step.id} />;
          case 'user':
            return <User key={step.id} />;
          case 'deviation':
          case 'details':
            return <ErrandInformation key={step.id} />;
          case 'summary':
            return null;
        }
      })}
    </>
  );
};
