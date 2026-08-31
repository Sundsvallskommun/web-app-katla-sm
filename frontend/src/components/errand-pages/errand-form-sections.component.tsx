'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { User } from '@components/errand-sections/user.component';
import { Divider } from '@sk-web-gui/react';
import { appConfig } from 'src/config/appconfig';
import { useConcernsIndividualUser } from 'src/hooks/use-event-concerns';

/**
 * Ärendets sektioner i ifyllnadsordning. Registreringssidan och det skapade ärendet
 * delar listan, så att ordningen inte kan glida isär mellan vyerna.
 *
 * Avdelarna markerar de två stora skarvarna: in i ärendets uppgifter, och in i
 * schemaformuläret. Parterna däremellan hänger ihop och skiljs bara av sina rubriker.
 */
export const ErrandFormSections: React.FC = () => {
  const concernsIndividualUser = useConcernsIndividualUser();

  return (
    <>
      <Reporter />
      <Divider />
      <AboutErrand />
      {concernsIndividualUser && <User />}
      {appConfig.features.otherPartiesDisclosure && <OtherParties />}
      <Divider />
      <DeviationInformation />
    </>
  );
};
