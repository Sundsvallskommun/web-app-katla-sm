import { avvikelse } from '../avvikelse/definition';
import type { KatlaDefinitionInput } from '../definition';

/** Exercises existing optional fields and drafts in browser tests, without production feature overrides. */
export const avvikelseTest = {
  ...avvikelse,
  id: 'avvikelse-test',
  testOnly: true,
  features: {
    ...avvikelse.features,
    draftEnabled: true,
    reducedStakeholderInfo: false,
    otherPartiesDisclosure: true,
  },
} satisfies KatlaDefinitionInput;
