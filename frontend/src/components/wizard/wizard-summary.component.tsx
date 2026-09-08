import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useTranslation } from 'react-i18next';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

export const WizardSummary: React.FC = () => {
  const { t } = useTranslation();
  const goToStep = useWizardStore((state) => state.goToStep);
  const stepErrors = useWizardStore((state) => state.stepErrors);
  const steps = useActiveWizardSteps();
  const stepsToReview = steps.filter((step) => step.id !== 'summary');

  return (
    <Stack gap={4}>
      <Heading level={1}>{t('errand-information:wizard.summary')}</Heading>
      {stepsToReview.map((step, index) => {
        const hasErrors = (stepErrors[index] ?? []).length > 0;
        return (
          <Card key={step.id}>
            <Stack direction="horizontal" align="center" justify="between" gap={4} wrap="wrap">
              <Stack gap={2}>
                <Badge
                  variant={hasErrors ? 'error' : 'success'}
                  label={
                    hasErrors ? t('errand-information:wizard.incomplete') : t('errand-information:wizard.complete')
                  }
                />
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
          </Card>
        );
      })}
    </Stack>
  );
};
