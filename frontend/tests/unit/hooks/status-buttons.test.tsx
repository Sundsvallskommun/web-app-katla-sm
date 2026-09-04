import { getErrandsCount } from '@services/errand-service/errand-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useStatusButtons } from 'src/hooks/use-status-buttons';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const errandServiceMocks = vi.hoisted(() => ({
  getErrandsCount: vi.fn(),
}));
const appConfigMocks = vi.hoisted(() => ({
  appConfig: { applicationName: 'test', features: { draftEnabled: false } },
}));
// Samma objekt varje anrop: ett nytt t per rendering skulle få effekterna att köra om i all evighet.
const i18nMocks = vi.hoisted(() => ({ t: (key: string) => key }));

vi.mock('@services/errand-service/errand-service', () => errandServiceMocks);
vi.mock('src/config/appconfig', () => appConfigMocks);
vi.mock('react-i18next', () => ({ useTranslation: () => i18nMocks }));

const getErrandsCountMock = vi.mocked(getErrandsCount);

const metadataStatuses = [
  { name: 'NEW' },
  { name: 'ASSIGNED' },
  { name: 'REVIEW' },
  { name: 'AWAITING_RESPONSE' },
  { name: 'SOLVED' },
];

/** Räkneanropen avslutas innan testet tar slut, så att inget tillstånd sätts efter rivningen. */
const renderStatusButtons = async () => {
  const { result } = renderHook(() => useStatusButtons());
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  return result;
};

beforeEach(() => {
  getErrandsCountMock.mockReset();
  getErrandsCountMock.mockResolvedValue({ count: 0 });
  appConfigMocks.appConfig.features.draftEnabled = false;
  useFilterStore.setState({ activeStatus: null, statuses: [] });
  useErrandCountStore.setState({ openErrandCount: 0, draftErrandCount: 0, closedErrandCount: 0 });
  useMetadataStore.setState({ metadata: { statuses: metadataStatuses } });
});

/**
 * Inskickade är alla statusar utom de avslutade. Tidigare visades bara NEW, vilket gjorde att en
 * rapport försvann ur rapportörens översikt så fort handläggaren flyttade den vidare.
 */
describe('useStatusButtons', () => {
  it('filtrerar på alla statusar utom den avslutade', async () => {
    const result = await renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual(['NEW', 'ASSIGNED', 'REVIEW', 'AWAITING_RESPONSE']);
    expect(result.current.activeStatus).toBe('OPEN');
  });

  it('håller utkasten utanför när de har en egen lista', async () => {
    appConfigMocks.appConfig.features.draftEnabled = true;
    useMetadataStore.setState({ metadata: { statuses: [...metadataStatuses, { name: 'DRAFT' }] } });

    await renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual(['NEW', 'ASSIGNED', 'REVIEW', 'AWAITING_RESPONSE']);
  });

  it('väntar på metadatan i stället för att hämta utan statusfilter', async () => {
    useMetadataStore.setState({ metadata: null });

    await renderStatusButtons();

    expect(useFilterStore.getState().statuses).toEqual([]);
    expect(getErrandsCountMock).not.toHaveBeenCalledWith({ statuses: [] });
  });

  it('räknar de inskickade med samma statusar som listan hämtar', async () => {
    await renderStatusButtons();

    expect(getErrandsCountMock).toHaveBeenCalledWith({ statuses: ['NEW', 'ASSIGNED', 'REVIEW', 'AWAITING_RESPONSE'] });
    expect(getErrandsCountMock).toHaveBeenCalledWith({ statuses: ['SOLVED'] });
  });

  it('byter till den avslutade listan när man väljer den', async () => {
    const result = await renderStatusButtons();

    const closedButton = result.current.statusButtons.find((button) => button.key === 'SOLVED');
    if (!closedButton) throw new Error('Hittade ingen knapp för avslutade');

    act(() => {
      result.current.onSelectStatus(closedButton);
    });

    expect(useFilterStore.getState().statuses).toEqual(['SOLVED']);
  });
});
