import { getActiveWizardSteps, WizardStep } from '@components/wizard/wizard-steps';
import { useMemo } from 'react';
import { useEventConcerns } from 'src/hooks/use-event-concerns';

export function useActiveWizardSteps(): WizardStep[] {
  const eventConcerns = useEventConcerns();

  return useMemo(() => getActiveWizardSteps(eventConcerns), [eventConcerns]);
}
