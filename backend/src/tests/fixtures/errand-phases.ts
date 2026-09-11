import { Phase } from '@/data-contracts/supportmanagement/data-contracts';

/** Faser i processordning, med de statusar respektive fas tillåter. */
export const errandPhases: Phase[] = [
  { id: 'phase-registration', name: 'REGISTRATION', displayName: 'Registrering', phaseOrder: 0, allowedStatuses: ['DRAFT'] },
  { id: 'phase-investigation', name: 'INVESTIGATION', displayName: 'Utredning', phaseOrder: 1, allowedStatuses: ['NEW', 'ONGOING'] },
  { id: 'phase-closure', name: 'CLOSURE', displayName: 'Avslut', phaseOrder: 2, allowedStatuses: ['SOLVED'] },
];
