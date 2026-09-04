import { LabelDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import { renderHook } from '@testing-library/react';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it } from 'vitest';

const label = (name: string, resourcePath: string, labels: LabelDTO[] = []): LabelDTO => ({
  id: resourcePath,
  classification: 'PLACE',
  displayName: name,
  resourceName: resourcePath.split('/').pop() ?? resourcePath,
  resourcePath,
  labels,
});

/** Rotnoderna heter som i API:t: platsstrukturen känns igen på sitt displayName, inte sitt namn. */
const labelStructure: LabelDTO[] = [
  {
    id: 'report-type',
    classification: 'report-type-root',
    displayName: 'Rapporttyp',
    resourceName: 'REPORT_TYPE',
    resourcePath: 'REPORT_TYPE',
    labels: [
      {
        id: 'deviation',
        classification: 'report-type',
        displayName: 'Avvikelse',
        resourceName: 'DEVIATION',
        resourcePath: 'REPORT_TYPE/DEVIATION',
        labels: [],
      },
      {
        id: 'abuse',
        classification: 'report-type',
        displayName: 'Missförhållande',
        resourceName: 'ABUSE',
        resourcePath: 'REPORT_TYPE/ABUSE',
        labels: [],
      },
    ],
  },
  {
    id: 'location',
    classification: 'location-root',
    displayName: 'Platsstruktur',
    resourceName: 'LOCATION',
    resourcePath: 'LOCATION',
    labels: [
      label('VOF Äldreboende', 'LOCATION/VOF_ALDREBOENDE', [
        label('VOF ÄB Skottsundsbacken geme.', 'LOCATION/VOF_ALDREBOENDE/GEME', [
          label('Blå', 'LOCATION/VOF_ALDREBOENDE/GEME/BLA'),
          label('Gul', 'LOCATION/VOF_ALDREBOENDE/GEME/GUL'),
        ]),
      ]),
    ],
  },
];

const facilityFormData = (facility: Record<string, unknown> | undefined): ErrandFormDataItem[] =>
  facility ?
    [
      {
        schemaName: 'avvikelse-plats-handelse',
        schemaId: 'schema-1',
        data: JSON.stringify({ facilityInfo: facility }),
      },
    ]
  : [];

const errand = (
  errandFormData: ErrandFormDataItem[],
  eventConcerns = 'GRUPP_VERKSAMHET',
  eventType = 'AVVIKELSE'
): ErrandFormDTO => ({
  errandFormData,
  parameters: [
    { key: 'eventType', values: [eventType] },
    { key: 'eventConcerns', values: [eventConcerns] },
  ],
});

const renderPrepareErrand = () => renderHook(() => usePrepareErrand()).result.current;

describe('usePrepareErrand', () => {
  beforeEach(() => {
    useMetadataStore.setState({ metadata: { labels: { labelStructure } } });
  });

  it('sätter hela labelkedjan från platsstrukturens rot till vald nod', () => {
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(
      errand(facilityFormData({ orgName: 'Blå', parentOrgName: 'VOF ÄB Skottsundsbacken geme.' })),
      'NEW'
    );

    expect(prepared.labels?.map((l) => l.resourceName)).toEqual([
      'REPORT_TYPE',
      'DEVIATION',
      'LOCATION',
      'VOF_ALDREBOENDE',
      'GEME',
      'BLA',
    ]);
  });

  it.each([
    ['AVVIKELSE', 'DEVIATION'],
    ['MISSFORHALLANDE', 'ABUSE'],
  ])('sätter rapporttypen %s som kedjan rot → typ', (eventType, resourceName) => {
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(errand([], 'GRUPP_VERKSAMHET', eventType), 'NEW');

    expect(prepared.labels?.map((l) => l.resourceName)).toEqual(['REPORT_TYPE', resourceName]);
  });

  it('sätter ingen rapporttyp innan användaren valt en', () => {
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(errand([], 'GRUPP_VERKSAMHET', ''), 'NEW');

    expect(prepared.labels).toEqual([]);
  });

  it('lägger inte till någon platslabel när valet inte pekar ut en nod i strukturen', () => {
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(errand(facilityFormData({ orgName: 'Okänd enhet' })), 'NEW');

    expect(prepared.labels?.map((l) => l.resourceName)).toEqual(['REPORT_TYPE', 'DEVIATION']);
  });

  it('namnger ärendeägaren med plats och enhet när händelsen berör hela verksamheten', () => {
    const { prepareErrandForApi } = renderPrepareErrand();

    const prepared = prepareErrandForApi(
      errand(facilityFormData({ orgName: 'Blå', parentOrgName: 'VOF ÄB Skottsundsbacken geme.' })),
      'NEW'
    );

    expect(prepared.stakeholders).toEqual([{ firstName: 'VOF ÄB Skottsundsbacken geme. Blå', role: 'PRIMARY' }]);
  });

  it('behandlar en plats med underenheter som ofullständig', () => {
    const { getFacilityStatus } = renderPrepareErrand();

    expect(getFacilityStatus(facilityFormData({ orgName: 'VOF ÄB Skottsundsbacken geme.' }))).toBe('INCOMPLETE');
    expect(getFacilityStatus(facilityFormData({ orgName: 'Okänd enhet' }))).toBe('INCOMPLETE');
  });

  it('godkänner en plats som är vald hela vägen ner', () => {
    const { getFacilityStatus } = renderPrepareErrand();

    expect(
      getFacilityStatus(facilityFormData({ orgName: 'Gul', parentOrgName: 'VOF ÄB Skottsundsbacken geme.' }))
    ).toBe('COMPLETE');
  });

  it('rapporterar ingen plats när formulärdatat saknas eller är trasigt', () => {
    const { getFacilityStatus } = renderPrepareErrand();

    expect(getFacilityStatus(facilityFormData(undefined))).toBe('NONE');
    expect(
      getFacilityStatus([{ schemaName: 'avvikelse-plats-handelse', schemaId: 'schema-1', data: '{trasig json' }])
    ).toBe('NONE');
  });
});
