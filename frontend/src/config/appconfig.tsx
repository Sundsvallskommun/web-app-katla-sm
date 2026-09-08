import { getKatlaDefinition, KatlaDefinition, KatlaFeatures } from '@katla/definitions';

export interface AppConfig {
  mode: 'katla' | 'catalogue';
  applicationName: string;
  features: KatlaFeatures;
  katla: KatlaDefinition | null;
  definitionRevision: string | null;
  catalogueUrl?: string;
}

const mode = process.env.NEXT_PUBLIC_APP_MODE;
if (mode !== 'katla' && mode !== 'catalogue') {
  throw new Error('NEXT_PUBLIC_APP_MODE must be katla or catalogue. Start through the workspace scripts.');
}

const katla =
  mode === 'katla' ?
    getKatlaDefinition(process.env.NEXT_PUBLIC_KATLA_ID ?? '', {
      allowTestDefinitions: process.env.NEXT_PUBLIC_ALLOW_TEST_DEFINITIONS === 'true',
    })
  : null;

export const appConfig: AppConfig = {
  mode,
  applicationName: katla?.applicationName ?? 'Mina Katlor',
  katla,
  definitionRevision: katla ? (process.env.NEXT_PUBLIC_DEFINITION_REVISION ?? null) : null,
  catalogueUrl: process.env.NEXT_PUBLIC_CATALOGUE_URL,
  features: katla?.features ?? {
    draftEnabled: false,
    errandFilter: false,
    reducedStakeholderInfo: false,
    disclosureDoneMark: false,
    otherPartiesDisclosure: false,
  },
};

/** Origin is already isolated by browser storage; include the mount path for siblings on one origin. */
export const applicationStorageScope = [
  'katla',
  mode,
  katla?.id ?? 'catalogue',
  process.env.NEXT_PUBLIC_BASE_PATH ?? '/',
]
  .map(encodeURIComponent)
  .join(':');
