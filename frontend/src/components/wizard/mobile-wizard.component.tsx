import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from '@astryxdesign/core/Layout';
import { useEffect, useRef } from 'react';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

import { WizardBottomBar } from './wizard-bottom-bar.component';
import { WizardHeader } from './wizard-header.component';
import { WizardStepContent } from './wizard-step-content.component';

export const MobileWizard: React.FC = () => {
  const steps = useActiveWizardSteps();
  const currentStep = useWizardStore((s) => s.currentStep);
  const goToStep = useWizardStore((s) => s.goToStep);
  const lastStep = steps.length - 1;
  const contentRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(currentStep);

  useEffect(() => {
    if (previousStep.current === currentStep) return;
    previousStep.current = currentStep;
    const content = contentRef.current;
    if (content) {
      content.scrollTop = 0;
      (content.querySelector('h1') ?? content).focus();
    }
  }, [currentStep]);

  // Antalet steg krymper när eventConcerns ändras från ENSKILD_BRUKARE, och
  // currentStep ligger kvar i sessionStorage. Utan klampningen pekar det
  // sparade steget utanför listan och wizarden renderar ett tomt steg.
  useEffect(() => {
    if (currentStep > lastStep) {
      goToStep(lastStep);
    }
  }, [currentStep, goToStep, lastStep]);

  return (
    <Layout
      contentWidth={640}
      padding={4}
      defaultHasDividers
      header={
        <LayoutHeader>
          <WizardHeader />
        </LayoutHeader>
      }
      footer={
        <LayoutFooter className="pb-safe" data-cy="report-actions">
          <WizardBottomBar />
        </LayoutFooter>
      }
    >
      <LayoutContent ref={contentRef} tabIndex={-1} className="scroll-py-2">
        <WizardStepContent />
      </LayoutContent>
    </Layout>
  );
};
