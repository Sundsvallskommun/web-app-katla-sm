import { Phase } from '@/data-contracts/supportmanagement/data-contracts';

/** Enligt kontraktet är 0 den inledande fasen. Faser utan ordning ställs sist. */
const UNORDERED_PHASE = Number.MAX_SAFE_INTEGER;

const byPhaseOrder = (first: Phase, second: Phase): number => (first.phaseOrder ?? UNORDERED_PHASE) - (second.phaseOrder ?? UNORDERED_PHASE);

const usablePhases = (phases: Phase[] | undefined): Phase[] =>
  (phases ?? []).filter((phase): phase is Phase & { id: string } => phase.deprecated !== true && typeof phase.id === 'string' && phase.id !== '');

const earliestPhaseId = (phases: Phase[]): string | undefined => [...phases].sort(byPhaseOrder)[0]?.id;

/**
 * Fasen är ärendets steg i handläggningsprocessen och hör ihop med statusen: varje fas i metadatan
 * räknar upp de statusar den tillåter. Skickas ingen fas med när ärendet skrivs står ärendet utan
 * fas i Draken, och handläggaren ser inte var i processen det befinner sig.
 *
 * Fasen läses ur metadatan i stället för att stå som en lista i koden, av samma skäl som statusarna:
 * processen ändras i namespacet och en fas vi inte känner till ska ändå gå att sätta.
 *
 * Tillåter flera faser samma status väljs den tidigaste i processen — ett ärende som just fått
 * statusen står i början av det den statusen omfattar, inte i slutet.
 */
export const resolveActivePhaseId = (status: string | undefined, phases: Phase[] | undefined): string | undefined => {
  if (status === undefined || status === '') return undefined;

  const candidates = usablePhases(phases);
  const allowingStatus = candidates.filter(phase => phase.allowedStatuses?.includes(status));
  if (allowingStatus.length > 0) return earliestPhaseId(allowingStatus);

  // Namespacet kan ha faser utan att ha kopplat statusar till dem. Då är den inledande fasen det
  // enda metadatan säger, och den är ett bättre svar än ingen fas alls för ett ärende som just
  // skrivits. Säger metadatan däremot vilka statusar faserna tillåter, och ingen tillåter den här
  // statusen, lämnas fasen orörd hellre än gissad.
  const mapsStatuses = candidates.some(phase => (phase.allowedStatuses?.length ?? 0) > 0);
  return mapsStatuses ? undefined : earliestPhaseId(candidates);
};
