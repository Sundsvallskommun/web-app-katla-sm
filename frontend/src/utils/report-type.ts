import { ErrandDTO, LabelDTO } from '@data-contracts/backend/data-contracts';

/**
 * Rapporttypen står på två ställen i ärendet: som parametern eventType, som radioknapparna i
 * "Om ärendet" sätter, och som labels under REPORT_TYPE, som är det handläggarvyn filtrerar på.
 * Den här filen håller ihop de två så att de inte glider isär igen.
 */

export const EVENT_TYPE_PARAMETER_KEY = 'eventType';

/** Värdena på parametern eventType. */
export const EVENT_TYPE_DEVIATION = 'AVVIKELSE';
export const EVENT_TYPE_MISCONDUCT = 'MISSFORHALLANDE';

/** Rapporttypens rot i labelstrukturen, och de två typerna under den. */
export const REPORT_TYPE_ROOT_RESOURCE_NAME = 'REPORT_TYPE';
export const REPORT_TYPE_DEVIATION = 'DEVIATION';
export const REPORT_TYPE_MISCONDUCT = 'ABUSE';

const REPORT_TYPE_BY_EVENT_TYPE: Record<string, string | undefined> = {
  [EVENT_TYPE_DEVIATION]: REPORT_TYPE_DEVIATION,
  [EVENT_TYPE_MISCONDUCT]: REPORT_TYPE_MISCONDUCT,
};

export const getReportTypeResourceName = (eventType: string | undefined): string | undefined =>
  eventType ? REPORT_TYPE_BY_EVENT_TYPE[eventType] : undefined;

export const getEventType = (errand: ErrandDTO): string | undefined =>
  errand.parameters?.find((parameter) => parameter.key === EVENT_TYPE_PARAMETER_KEY)?.values?.[0];

const isReportTypeLabel = (label: LabelDTO): boolean =>
  label.resourceName === REPORT_TYPE_DEVIATION || label.resourceName === REPORT_TYPE_MISCONDUCT;

/**
 * Labeln är rapporttypen så som API:t ser den och läses därför i första hand. Ärenden som
 * registrerades innan typen började sättas som label bär den bara som parameter, och ska visas
 * rätt ändå.
 */
export const getErrandReportType = (errand: ErrandDTO): string | undefined =>
  errand.labels?.find(isReportTypeLabel)?.resourceName ?? getReportTypeResourceName(getEventType(errand));

export const isMisconduct = (errand: ErrandDTO): boolean => getErrandReportType(errand) === REPORT_TYPE_MISCONDUCT;
