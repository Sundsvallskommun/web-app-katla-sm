import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO } from '@interfaces/errand-form';
import type { TFunction } from 'i18next';

/** Värdet på parametern eventConcerns när händelsen berör en enskild brukare. */
export const EVENT_CONCERNS_INDIVIDUAL = 'ENSKILD_BRUKARE';

/**
 * Om rapporten bär något användaren skulle förlora.
 *
 * Rapportören räknas inte: den hämtas automatiskt från inloggningen innan användaren gjort
 * något, och skulle annars göra varje tom registrering till "påbörjad". Räkningen går på
 * innehåll i stället för react-hook-forms isDirty, eftersom formuläret sätts med setValue
 * utan shouldDirty och flaggan därför aldrig slår om.
 */
export const hasReportContent = (values: ErrandFormDTO): boolean => {
  const hasParameters = (values.parameters?.length ?? 0) > 0;
  // Schemaformuläret skriver en post redan vid montering, så ett tomt objekt är inte innehåll.
  const hasFormData = values.errandFormData?.some((entry) => entry.data && entry.data !== '{}') ?? false;
  const hasAddedStakeholders = values.stakeholders?.some((stakeholder) => stakeholder.role !== 'REPORTER') ?? false;

  return hasParameters || hasFormData || hasAddedStakeholders;
};

export const getTypeDisplayName = (errand: ErrandDTO, t: TFunction) => {
  const hasAdverseIncident = errand.labels?.some((l) => l.resourceName === 'ABUSE');
  return hasAdverseIncident ?
      t('errand-information:about.event_type_misconduct')
    : t('errand-information:about.event_type_deviation');
};
