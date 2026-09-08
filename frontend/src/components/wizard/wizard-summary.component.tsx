import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useTranslation } from 'react-i18next';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

export const WizardSummary: React.FC = () => {
  const { t } = useTranslation();
  const goToStep = useWizardStore((state) => state.goToStep);
  const steps = useActiveWizardSteps();
  const stepsToReview = steps.filter((step) => step.id !== 'summary');

  return (
    <Stack gap={4}>
      <Heading level={1}>{t('errand-information:wizard.summary')}</Heading>
      {stepsToReview.map((step, index) => {
        return (
          <Stack key={step.id} gap={4}>
            <Stack direction="horizontal" align="center" justify="between" gap={4} wrap="wrap">
              <Stack gap={2}>
                <Text weight="semibold">{t(step.titleKey)}</Text>
              </Stack>
              <Button
                label={t('errand-information:wizard.edit')}
                variant="ghost"
                onClick={() => {
                  goToStep(index);
                }}
              />
            </Stack>
            <Divider />
          </Stack>
        );
      })}
    </Stack>
  );
};
