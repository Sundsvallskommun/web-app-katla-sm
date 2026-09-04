import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { isMisconduct } from '@utils/report-type';
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
/**
 * Sant först när något faktiskt är ifyllt. Schemaformuläret skriver en post redan vid montering,
 * och den bär strukturen för fälten – tomma objekt för objektfält som platsen. Ett strängjämförande
 * mot '{}' räckte därför inte: `{"facilityInfo":{}}` är lika orört som `{}`.
 */
const hasFilledValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasFilledValue);
  if (typeof value === 'object') return Object.values(value).some(hasFilledValue);

  return true;
};

const hasFilledFormData = (data: string | undefined): boolean => {
  if (!data) return false;

  try {
    return hasFilledValue(JSON.parse(data));
  } catch {
    // Ogiltig JSON är något användaren inte kan ha skrivit av misstag, och behandlas som innehåll.
    return true;
  }
};

export const hasReportContent = (values: ErrandFormDTO): boolean => {
  const hasParameters = (values.parameters?.length ?? 0) > 0;
  const hasFormData = values.errandFormData?.some((entry) => hasFilledFormData(entry.data)) ?? false;
  const hasAddedStakeholders = values.stakeholders?.some((stakeholder) => stakeholder.role !== 'REPORTER') ?? false;

  return hasParameters || hasFormData || hasAddedStakeholders;
};

export const getTypeDisplayName = (errand: ErrandDTO, t: TFunction) =>
  isMisconduct(errand) ?
    t('errand-information:about.event_type_misconduct')
  : t('errand-information:about.event_type_deviation');
