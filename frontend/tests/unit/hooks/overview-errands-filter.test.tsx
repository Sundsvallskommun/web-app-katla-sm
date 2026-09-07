import { getErrands, getMetadata } from '@services/errand-service/errand-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useFilterStore } from 'src/stores/filter-store';
import { useMetadataStore } from 'src/stores/metadata-store';
import { useSortStore } from 'src/stores/sort-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const errandServiceMocks = vi.hoisted(() => ({
  getErrands: vi.fn(),
  getMetadata: vi.fn(),
}));
const i18nMocks = vi.hoisted(() => ({ t: (key: string) => key }));

vi.mock('@services/errand-service/errand-service', () => errandServiceMocks);
vi.mock('react-i18next', () => ({ useTranslation: () => i18nMocks }));

const getErrandsMock = vi.mocked(getErrands);
const getMetadataMock = vi.mocked(getMetadata);

beforeEach(() => {
  getErrandsMock.mockReset();
  getErrandsMock.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 });
  getMetadataMock.mockReset();
  getMetadataMock.mockResolvedValue({});
  useSortStore.setState({ sortColumn: 'created', sortOrder: 'desc', page: 0, size: 12, rowHeight: 'normal' });
  useFilterStore.setState({ activeStatus: null, statuses: [] });
  useMetadataStore.setState({ metadata: null });
});

/**
 * Statuslistan kommer ur metadatan. Innan den finns är filtret inte satt, och en hämtning utan
 * statusfilter svarar med alla ärenden — även de avslutade, som översikten aldrig ska visa i
 * Inskickade. Kommer metadatan aldrig är den omgången dessutom den enda som gjorts, så dess svar
 * blir det som ligger kvar på skärmen.
 */
describe('useOverviewErrands utan statusfilter', () => {
  it('hämtar inte medan statuslistan är tom', async () => {
    renderHook(() => useOverviewErrands());

    await act(async () => {
      await Promise.resolve();
    });

    expect(getErrandsMock).not.toHaveBeenCalled();
  });

  /**
   * Håller ihop spärren ovan med laddläget: hoppar hämtningen över utan att kroken säger att den
   * laddar, står tabellen med noll rader och inget pågående anrop — alltså tomtexten.
   */
  it('rapporterar laddning medan filtret saknas, så tabellen inte säger att det saknas rapporter', () => {
    const { result } = renderHook(() => useOverviewErrands());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  it('hämtar med statusarna så snart filtret kommit', async () => {
    renderHook(() => useOverviewErrands());

    act(() => {
      useFilterStore.getState().setStatuses(['NEW', 'REVIEW']);
    });

    await waitFor(() => {
      expect(getErrandsMock).toHaveBeenCalledTimes(1);
    });
    expect(getErrandsMock).toHaveBeenCalledWith(expect.objectContaining({ statuses: ['NEW', 'REVIEW'] }));
  });
});

it('returns from accumulated mobile rows to the selected desktop page when the viewport changes', async () => {
  useFilterStore.setState({ activeStatus: 'OPEN', statuses: ['NEW'] });
  const firstPage = { content: [{ errandNumber: 'FIRST' }], totalElements: 2, totalPages: 2 };
  getErrandsMock
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValueOnce({ ...firstPage, content: [{ errandNumber: 'SECOND' }] })
    .mockResolvedValueOnce(firstPage);
  const { result, rerender } = renderHook(({ mode }) => useOverviewErrands({ mode }), {
    initialProps: { mode: 'mobile' as 'mobile' | 'desktop' },
  });
  await waitFor(() => {
    expect(result.current.rows).toEqual(firstPage.content);
  });
  act(() => {
    result.current.loadMore();
  });
  await waitFor(() => {
    expect(result.current.rows).toHaveLength(2);
  });
  rerender({ mode: 'desktop' });
  await waitFor(() => {
    expect(result.current.rows).toEqual(firstPage.content);
  });
  expect(getErrandsMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, statuses: ['NEW'] }));
});
