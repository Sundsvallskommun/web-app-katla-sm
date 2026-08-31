import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import type { TFunction } from 'i18next';

/** Värdet på parametern eventConcerns när händelsen berör en enskild brukare. */
export const EVENT_CONCERNS_INDIVIDUAL = 'ENSKILD_BRUKARE';

export const getTypeDisplayName = (errand: ErrandDTO, t: TFunction) => {
  const hasAdverseIncident = errand.labels?.some((l) => l.resourceName === 'ABUSE');
  return hasAdverseIncident ?
      t('errand-information:about.event_type_misconduct')
    : t('errand-information:about.event_type_deviation');
};
