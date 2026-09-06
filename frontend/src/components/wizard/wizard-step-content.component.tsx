import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { AboutErrandContent } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherPartiesContent } from '@components/errand-sections/other-parties.component';
import { ReporterContent } from '@components/errand-sections/reporter.component';
import { UserContent } from '@components/errand-sections/user.component';
import { SectionHeader } from '@components/misc/section-header.component';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

import { WizardSummary } from './wizard-summary.component';

export const WizardStepContent: React.FC = () => {
  const { t } = useTranslation();
  const currentStep = useWizardStore((s) => s.currentStep);
  const steps = useActiveWizardSteps();
  const step = steps[currentStep];

  const renderStepContent = () => {
    switch (step?.id) {
      case 'about':
        return <AboutErrandContent />;
      case 'reporter':
        return (
          <>
            <ReporterContent />
            {appConfig.features.otherPartiesDisclosure && (
              <div className="mt-6">
                <SectionHeader
                  as="h2"
                  headingClassName="text-lg"
                  className="mb-3"
                  title={t('errand-information:other_parties.title')}
                  description={t('errand-information:other_parties.description')}
                />
                <OtherPartiesContent />
              </div>
            )}
          </>
        );
      case 'user':
        return <UserContent />;
      case 'deviation':
        return <DeviationInformation compact />;
      case 'summary':
        return <WizardSummary />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6">
      {step?.id !== 'summary' && (
        <Stack gap={2} className="mb-4">
          <Heading level={1}>{t(step?.titleKey)}</Heading>
          {step?.descriptionKey && <Text color="secondary">{t(step.descriptionKey)}</Text>}
        </Stack>
      )}
      {renderStepContent()}
    </div>
  );
};
