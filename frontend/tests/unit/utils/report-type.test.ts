import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import { getErrandReportType } from '@utils/report-type';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

/** Räcker för den här utilityn: översättningen returnerar nyckeln så att valet syns i utfallet. */
const translate = ((key: string) => key) as unknown as TFunction;

const errandWithLabel = (resourceName: string): ErrandDTO => ({
  labels: [
    { classification: 'report-type-root', resourceName: 'REPORT_TYPE', resourcePath: 'REPORT_TYPE' },
    { classification: 'report-type', resourceName, resourcePath: `REPORT_TYPE/${resourceName}` },
    { classification: 'location-root', resourceName: 'LOCATION', resourcePath: 'LOCATION' },
  ],
});

/**
 * Rapporttypen läses från labeln, som är den API:t filtrerar på. Frånvaron av en ABUSE-label
 * betydde tidigare "avvikelse", vilket dolde att avvikelser gick in helt utan rapporttyp.
 */
describe('report type', () => {
  it.each([
    ['DEVIATION', 'errand-information:about.event_type_deviation'],
    ['ABUSE', 'errand-information:about.event_type_misconduct'],
  ])('läser rapporttypen %s från labeln', (resourceName, expectedKey) => {
    const errand = errandWithLabel(resourceName);

    expect(getErrandReportType(errand)).toBe(resourceName);
    expect(getTypeDisplayName(errand, translate)).toBe(expectedKey);
  });

  it('faller tillbaka på parametern för ärenden registrerade innan typen sattes som label', () => {
    const errand: ErrandDTO = { parameters: [{ key: 'eventType', values: ['MISSFORHALLANDE'] }] };

    expect(getErrandReportType(errand)).toBe('ABUSE');
    expect(getTypeDisplayName(errand, translate)).toBe('errand-information:about.event_type_misconduct');
  });

  it('låter kategorilabels med liknande namn vara ifred', () => {
    const errand: ErrandDTO = {
      labels: [
        { classification: 'category', resourceName: 'PHYSICAL_ABUSE', resourcePath: 'CATEGORY/SOL_LSS/PHYSICAL_ABUSE' },
      ],
    };

    expect(getErrandReportType(errand)).toBeUndefined();
  });

  it('visar avvikelse när ärendet inte bär någon typ alls', () => {
    expect(getTypeDisplayName({}, translate)).toBe('errand-information:about.event_type_deviation');
  });
});
