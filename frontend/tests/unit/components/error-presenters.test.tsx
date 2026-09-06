import { ErrorAlertList } from '@components/misc/error-alert.component';
import { render, screen } from '@testing-library/react';
import { ErrandTable } from 'src/components/errand-table/errand-table.component';
import { MobileErrandsList } from 'src/components/mobile/mobile-errands-list.component';
import { MobileStatusTabs } from 'src/components/mobile/mobile-status-tabs.component';
import { OverviewStatusNav } from 'src/components/sidebars/overview-status-nav.component';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const overviewErrandsMock = vi.hoisted(() => ({
  state: {
    rows: [] as unknown[],
    isLoading: false,
    totalPages: 1,
    totalElements: 0,
    errandsError: null as string | null,
    metadataError: null as string | null,
  },
}));

vi.mock('src/hooks/use-overview-errands', () => ({
  useOverviewErrands: () => overviewErrandsMock.state,
}));

vi.mock('src/hooks/use-status-buttons', () => ({
  useStatusButtons: () => ({
    statusButtons: [],
    activeStatus: null,
    onSelectStatus: vi.fn(),
    isLoading: false,
    error: 'api_errors.counts',
  }),
}));

beforeEach(() => {
  overviewErrandsMock.state = {
    rows: [],
    isLoading: false,
    totalPages: 1,
    totalElements: 0,
    errandsError: 'api_errors.errands',
    metadataError: null,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('API error presenters', () => {
  it('announces each concurrent error once and keeps every message visible', () => {
    render(<ErrorAlertList messages={['Kunde inte hämta ärenden.', 'Kunde inte hämta metadata.']} />);

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent('Kunde inte hämta ärenden.');
    expect(alerts[1]).toHaveTextContent('Kunde inte hämta metadata.');
    expect(screen.getAllByText('Kunde inte hämta ärenden.')).toHaveLength(1);
    expect(screen.getAllByText('Kunde inte hämta metadata.')).toHaveLength(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('replaces the desktop false-empty state with an error alert', () => {
    render(<ErrandTable />);

    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.errands');
    expect(screen.queryByText('errand-information:no_errands')).not.toBeInTheDocument();
  });

  it('replaces the mobile false-empty state with an error alert', () => {
    render(
      <MobileErrandsList
        rows={[]}
        isLoading={false}
        hasMore={false}
        loadMore={vi.fn()}
        errors={['api_errors.errands']}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.errands');
    expect(screen.queryByText('errand-information:no_errands')).not.toBeInTheDocument();
  });

  /**
   * Utan statuslista görs ingen hämtning, så laddläget kan bli stående. Felet som förklarar varför
   * måste synas ändå — annars möts användaren av en spinner utan slut och utan besked.
   */
  it('visar felet i tabellen även medan listan fortfarande laddar', () => {
    overviewErrandsMock.state = {
      rows: [],
      isLoading: true,
      totalPages: 1,
      totalElements: 0,
      errandsError: null,
      metadataError: 'api_errors.metadata',
    };

    render(<ErrandTable />);

    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.metadata');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('visar felet i mobillistan även medan den fortfarande laddar', () => {
    render(
      <MobileErrandsList rows={[]} isLoading hasMore={false} loadMore={vi.fn()} errors={['api_errors.metadata']} />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.metadata');
  });

  it('shows count errors in the mobile and expanded desktop selectors', () => {
    const { unmount } = render(<MobileStatusTabs />);
    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.counts');
    unmount();

    render(<OverviewStatusNav />);
    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.counts');
  });

  it('keeps a visible and accessible error indicator in the collapsed desktop selector', () => {
    render(<OverviewStatusNav collapsed />);

    expect(screen.getByRole('alert')).toHaveAttribute('title', 'api_errors.counts');
    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.counts');
  });
});
