'use client';

import { ErrandErrorSummary } from '@components/errand-pages/errand-error-summary.component';
import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { User } from '@components/errand-sections/user.component';
import { appConfig } from 'src/config/appconfig';
import { useConcernsIndividualUser } from 'src/hooks/use-event-concerns';

/**
 * Ärendets sektioner i ifyllnadsordning. Registreringssidan och det skapade ärendet
 * delar listan, så att ordningen inte kan glida isär mellan vyerna.
 *
 * Varje avsnitt bär sitt eget kort, så skarvarna syns av ytorna i sig. Avdelare mellan dem
 * skulle bara upprepa den gränsen.
 */
export const ErrandFormSections: React.FC = () => {
  const concernsIndividualUser = useConcernsIndividualUser();

  return (
    <>
      <ErrandErrorSummary />
      <Reporter />
      <AboutErrand />
      {concernsIndividualUser && <User />}
      {appConfig.features.otherPartiesDisclosure && <OtherParties />}
      <DeviationInformation />
    </>
  );
};
