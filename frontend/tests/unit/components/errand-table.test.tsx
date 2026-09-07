import { ErrandTable } from '@components/errand-table/errand-table.component';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import type { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useSortStore } from 'src/stores/sort-store';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import commonSv from '../../../locales/sv/common.json';

type ErrandTableData = Pick<
  ReturnType<typeof useOverviewErrands>,
  'rows' | 'isLoading' | 'totalPages' | 'totalElements' | 'errandsError' | 'metadataError'
>;

const useOverviewErrandsMock = vi.fn<() => ErrandTableData>();
const i18n = createInstance();

// Raden navigerar med routern för den som pekar; testet bryr sig bara om att den finns.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@components/errand-table/errand-table-footer.component', () => ({
  ErrandTableFooter: () => <div>Sidfot</div>,
}));

describe('ErrandTable', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'sv',
      resources: { sv: { common: commonSv } },
      defaultNS: 'common',
      ns: ['common'],
    });
  });

  beforeEach(() => {
    useOverviewErrandsMock.mockReset();
    useSortStore.getState().reset();
  });

  it('renders valid table body markup and exposes navigation as a named link', () => {
    useOverviewErrandsMock.mockReturnValue({
      rows: [
        {
          errandNumber: 'AIA-25120019',
          status: 'NEW',
          touched: '2026-08-12T08:00:00Z',
          labels: [],
        },
      ],
      isLoading: false,
      totalPages: 1,
      totalElements: 1,
      errandsError: null,
      metadataError: null,
    });

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ErrandTable {...useOverviewErrandsMock()} />
      </I18nextProvider>
    );

    const link = screen.getByRole('link', { name: 'Öppna ärende AIA-25120019' });
    expect(link).toHaveAttribute('href', '/arende/AIA-25120019/grundinformation');
    expect(link.closest('tr')).not.toHaveAttribute('tabindex');
    expect(link.closest('tbody')).toBe(container.querySelector('table > tbody'));
  });

  it('keeps loading rows decorative inside the busy table', () => {
    useOverviewErrandsMock.mockReturnValue({
      rows: [],
      isLoading: true,
      totalPages: 1,
      totalElements: 0,
      errandsError: null,
      metadataError: null,
    });

    render(
      <I18nextProvider i18n={i18n}>
        <ErrandTable {...useOverviewErrandsMock()} />
      </I18nextProvider>
    );

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('changes sorting through named controls and announces the active sort direction', async () => {
    useOverviewErrandsMock.mockReturnValue({
      rows: [{ errandNumber: 'AIA-25120019', status: 'NEW', touched: '2026-08-12T08:00:00Z', labels: [] }],
      isLoading: false,
      totalPages: 1,
      totalElements: 1,
      errandsError: null,
      metadataError: null,
    });
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <ErrandTable {...useOverviewErrandsMock()} />
      </I18nextProvider>
    );
    const sortButton = screen.getByRole('button', { name: commonSv['errand-table'].header.errandNumber });
    await user.click(sortButton);
    expect(sortButton.closest('th')).toHaveAttribute('aria-sort', 'descending');
    await user.click(sortButton);
    expect(sortButton.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(useSortStore.getState()).toMatchObject({ sortColumn: 'errandNumber', sortOrder: 'asc', page: 0 });
  });
});
