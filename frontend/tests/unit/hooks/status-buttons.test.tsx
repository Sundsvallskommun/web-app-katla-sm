import { act, renderHook } from '@testing-library/react';
import { useStatusButtons } from 'src/hooks/use-status-buttons';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const appConfigMocks = vi.hoisted(() => ({
  appConfig: { applicationName: 'test', features: { draftEnabled: false } },
}));
// Samma objekt varje anrop: ett nytt t per rendering skulle få effekterna att köra om i all evighet.
const i18nMocks = vi.hoisted(() => ({ t: (key: string) => key }));

vi.mock('src/config/appconfig', () => appConfigMocks);
vi.mock('react-i18next', () => ({ useTranslation: () => i18nMocks }));

const metadataStatuses = [
  { name: 'NEW' },
  { name: 'ASSIGNED' },
  { name: 'REVIEW' },
  { name: 'AWAITING_RESPONSE' },
  { name: 'SOLVED' },
];

const renderStatusButtons = () => renderHook(() => useStatusButtons()).result;

beforeEach(() => {
  appConfigMocks.appConfig.features.draftEnabled = false;
  useFilterStore.setState({ activeStatus: null, statuses: [] });
  useMetadataStore.setState({ metadata: { statuses: metadataStatuses } });
});

/**
 * Inskickade är alla statusar utom de avslutade. Tidigare visades bara NEW, vilket gjorde att en
 * rapport försvann ur rapportörens översikt så fort handläggaren flyttade den vidare.
 */
describe('useStatusButtons', () => {
  it('filtrerar på alla statusar utom den avslutade', () => {
    const result = renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual(['NEW', 'ASSIGNED', 'REVIEW', 'AWAITING_RESPONSE']);
    expect(result.current.activeStatus).toBe('OPEN');
  });

  it('håller utkasten utanför när de har en egen lista', () => {
    appConfigMocks.appConfig.features.draftEnabled = true;
    useMetadataStore.setState({ metadata: { statuses: [...metadataStatuses, { name: 'DRAFT' }] } });

    renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual(['NEW', 'ASSIGNED', 'REVIEW', 'AWAITING_RESPONSE']);
  });

  it('väntar på metadatan i stället för att hämta utan statusfilter', () => {
    useMetadataStore.setState({ metadata: null });

    renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual([]);
  });

  it('byter till den avslutade listan när man väljer den', () => {
    const result = renderStatusButtons();

    const closedButton = result.current.statusButtons.find((button) => button.key === 'SOLVED');
    if (!closedButton) throw new Error('Hittade ingen knapp för avslutade');

    act(() => {
      result.current.onSelectStatus(closedButton);
    });

    expect(useFilterStore.getState().statuses).toEqual(['SOLVED']);
  });
});
