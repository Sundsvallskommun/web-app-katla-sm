import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';

export interface WizardStep {
  id: string;
  titleKey: string;
}

export const ALL_WIZARD_STEPS: WizardStep[] = [
  { id: 'reporter', titleKey: 'errand-information:reporter.title' },
  { id: 'about', titleKey: 'errand-information:about.title' },
  { id: 'user', titleKey: 'errand-information:user.title' },
  { id: 'deviation', titleKey: 'errand-information:deviation_information.title' },
  { id: 'summary', titleKey: 'errand-information:wizard.summary' },
];

export function getActiveWizardSteps(eventConcerns: string): WizardStep[] {
  if (eventConcerns === EVENT_CONCERNS_INDIVIDUAL) {
    return ALL_WIZARD_STEPS;
  }
  return ALL_WIZARD_STEPS.filter((step) => step.id !== 'user');
}
