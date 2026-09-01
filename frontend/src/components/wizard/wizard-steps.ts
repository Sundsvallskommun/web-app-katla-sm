import { EVENT_CONCERNS_INDIVIDUAL } from '@utils/errand-helpers';

export interface WizardStep {
  id: string;
  titleKey: string;
  /** Samma beskrivning som avsnittet visar på stor skärm. Stegen utan nyckel har ingen. */
  descriptionKey?: string;
}

export const ALL_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'reporter',
    titleKey: 'errand-information:reporter.title',
    descriptionKey: 'errand-information:reporter.description',
  },
  { id: 'about', titleKey: 'errand-information:about.title', descriptionKey: 'errand-information:about.description' },
  { id: 'user', titleKey: 'errand-information:user.title', descriptionKey: 'errand-information:user.description' },
  { id: 'deviation', titleKey: 'errand-information:deviation_information.title' },
  { id: 'summary', titleKey: 'errand-information:wizard.summary' },
];

export function getActiveWizardSteps(eventConcerns: string): WizardStep[] {
  if (eventConcerns === EVENT_CONCERNS_INDIVIDUAL) {
    return ALL_WIZARD_STEPS;
  }
  return ALL_WIZARD_STEPS.filter((step) => step.id !== 'user');
}
