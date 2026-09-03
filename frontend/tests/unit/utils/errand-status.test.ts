import { StatusDTO } from '@data-contracts/backend/data-contracts';
import { getOpenStatuses, getStatusDisplayName } from '@utils/errand-status';
import { describe, expect, it } from 'vitest';

const statuses: StatusDTO[] = [
  { name: 'NEW', displayName: 'Ny', externalDisplayName: 'Inskickat' },
  { name: 'REVIEW', displayName: 'Under granskning' },
  { name: 'DRAFT', externalDisplayName: 'Utkast' },
  { name: 'SOLVED', externalDisplayName: 'Avslutad' },
  { name: 'ARCHIVED', externalDisplayName: 'Arkiverad', deprecated: true },
];

describe('getStatusDisplayName', () => {
  it('visar namnet som är skrivet för rapportören', () => {
    expect(getStatusDisplayName('NEW', statuses)).toBe('Inskickat');
  });

  it('faller tillbaka på handläggarens namn när det externa saknas', () => {
    expect(getStatusDisplayName('REVIEW', statuses)).toBe('Under granskning');
  });

  it('visar koden hellre än ingenting för en status metadatan inte känner till', () => {
    expect(getStatusDisplayName('UPSTART', statuses)).toBe('UPSTART');
    expect(getStatusDisplayName('NEW', undefined)).toBe('NEW');
  });

  it('ger tom text när ärendet saknar status', () => {
    expect(getStatusDisplayName(undefined, statuses)).toBe('');
  });

  /**
   * Metadatan finns bara på svenska. Där är den facit; i ett annat språk är vår översättning det
   * enda som är skrivet på rätt språk och går därför först.
   */
  describe('språkval', () => {
    it('låter metadatan gå före översättningen på svenska', () => {
      expect(getStatusDisplayName('NEW', statuses, { translation: 'Nyinkommet' })).toBe('Inskickat');
    });

    it('låter översättningen gå före metadatan i ett annat språk', () => {
      expect(getStatusDisplayName('NEW', statuses, { translation: 'Submitted', preferTranslation: true })).toBe(
        'Submitted'
      );
    });

    it('visar det svenska namnet för en status vi inte översatt', () => {
      expect(getStatusDisplayName('SOLVED', statuses, { translation: '', preferTranslation: true })).toBe('Avslutad');
    });

    it('använder översättningen för en status metadatan inte känner till', () => {
      expect(getStatusDisplayName('UPSTART', statuses, { translation: 'Starting up', preferTranslation: true })).toBe(
        'Starting up'
      );
      expect(getStatusDisplayName('UPSTART', statuses, { translation: 'Uppstart' })).toBe('Uppstart');
    });
  });
});

/**
 * Rapporten ska ligga kvar i Inskickade även efter att handläggaren flyttat den vidare, så listan
 * är alla statusar utom de avslutade — inte en uppräkning av de statusar appen råkar känna till.
 */
describe('getOpenStatuses', () => {
  it('tar med alla statusar utom den avslutade', () => {
    expect(getOpenStatuses(statuses, false)).toEqual(['NEW', 'REVIEW', 'DRAFT']);
  });

  it('håller utkasten utanför när de har en egen lista', () => {
    expect(getOpenStatuses(statuses, true)).toEqual(['NEW', 'REVIEW']);
  });

  it('utelämnar avvecklade statusar', () => {
    expect(getOpenStatuses(statuses, false)).not.toContain('ARCHIVED');
  });

  it('ger en tom lista innan metadatan hämtats, i stället för att gissa', () => {
    expect(getOpenStatuses(undefined, false)).toEqual([]);
  });
});
