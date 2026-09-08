import type { KatlaDefinitionInput } from '../definition';

/** Existing product choices from frontend/.env-example before workspace migration. */
export const avvikelse = {
  id: 'avvikelse',
  applicationName: 'Katla',
  description: 'Rapportera avvikelser och missförhållanden.',
  flow: 'avvikelse',
  forms: [{ schemaName: 'avvikelse-plats-handelse' }],
  features: {
    draftEnabled: false,
    errandFilter: true,
    reducedStakeholderInfo: true,
    disclosureDoneMark: false,
    otherPartiesDisclosure: false,
  },
  errandDefaults: {
    title: 'Empty errand',
    priority: 'MEDIUM',
    channel: 'ESERVICE',
    resolution: 'INFORMED',
  },
} satisfies KatlaDefinitionInput;
