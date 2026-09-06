import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Stack } from '@astryxdesign/core/Stack';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { useTranslation } from 'react-i18next';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

interface WizardHeaderProps {
  variant?: 'bar' | 'stepper';
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ variant = 'bar' }) => {
  const { t } = useTranslation();
  const currentStep = useWizardStore((state) => state.currentStep);
  const steps = useActiveWizardSteps();
  const label = t('errand-information:wizard.step_indicator', { current: currentStep + 1, total: steps.length });
  return (
    <Stack padding={4} className="border-b border-default bg-surface">
      {variant === 'bar' ?
        <ProgressBar label={label} value={currentStep + 1} max={steps.length} />
      : <Stepper label={label} activeStep={currentStep}>
          {steps.map((step, index) => (
            <Step key={step.id} step={index} label={t(step.titleKey)} />
          ))}
        </Stepper>
      }
    </Stack>
  );
};
