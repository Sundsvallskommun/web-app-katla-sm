import { describe, expect, it } from 'vitest';

import { Phase } from '@/data-contracts/supportmanagement/data-contracts';
import { resolveActivePhaseId } from '@/utils/errand-phase';

import { errandPhases } from './fixtures/errand-phases';

const withoutAllowedStatuses: Phase[] = errandPhases.map(({ allowedStatuses: _allowedStatuses, ...phase }) => phase);

describe('resolveActivePhaseId', () => {
  it.each([
    ['DRAFT', 'phase-registration'],
    ['NEW', 'phase-investigation'],
    ['ONGOING', 'phase-investigation'],
    ['SOLVED', 'phase-closure'],
  ])('picks the phase that allows status %s', (status, expected) => {
    expect(resolveActivePhaseId(status, errandPhases)).toBe(expected);
  });

  it('picks the earliest phase when several allow the same status', () => {
    const phases: Phase[] = [
      { id: 'late', name: 'LATE', phaseOrder: 3, allowedStatuses: ['NEW'] },
      { id: 'early', name: 'EARLY', phaseOrder: 1, allowedStatuses: ['NEW'] },
    ];

    expect(resolveActivePhaseId('NEW', phases)).toBe('early');
  });

  it('skips deprecated phases', () => {
    const phases: Phase[] = [{ id: 'old', name: 'OLD', phaseOrder: 0, allowedStatuses: ['NEW'], deprecated: true }, ...errandPhases];

    expect(resolveActivePhaseId('NEW', phases)).toBe('phase-investigation');
  });

  it.each([undefined, '', 'UNKNOWN_STATUS'])('leaves the phase untouched for status %s', status => {
    expect(resolveActivePhaseId(status, errandPhases)).toBeUndefined();
  });

  it.each([undefined, []])('leaves the phase untouched when metadata has no phases', phases => {
    expect(resolveActivePhaseId('NEW', phases)).toBeUndefined();
  });

  it('falls back to the initial phase when no phase maps statuses', () => {
    expect(resolveActivePhaseId('NEW', withoutAllowedStatuses)).toBe('phase-registration');
  });

  it('places phases without an order last', () => {
    const phases: Phase[] = [
      { id: 'unordered', name: 'UNORDERED' },
      { id: 'first', name: 'FIRST', phaseOrder: 0 },
    ];

    expect(resolveActivePhaseId('NEW', phases)).toBe('first');
  });

  it('ignores phases without an id, since the id is what identifies the phase upstream', () => {
    const phases: Phase[] = [
      { name: 'NAMED_ONLY', phaseOrder: 0, allowedStatuses: ['NEW'] },
      { id: '', name: 'EMPTY_ID', phaseOrder: 1, allowedStatuses: ['NEW'] },
    ];

    expect(resolveActivePhaseId('NEW', phases)).toBeUndefined();
  });
});
