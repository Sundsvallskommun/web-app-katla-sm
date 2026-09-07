import Overview from '@app/[locale]/oversikt/page';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { render, screen } from '@testing-library/react';
import type { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ mobile: false }));
const overview = vi.hoisted((): { value: ReturnType<typeof useOverviewErrands> } => ({
  value: {
    rows: [],
    isLoading: false,
    totalPages: 1,
    totalElements: 0,
    hasMore: false,
    loadMore: vi.fn(),
    page: 0,
    errandsError: null,
    metadataError: null,
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@astryxdesign/core/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@astryxdesign/core/hooks')>()),
  useMediaQuery: () => state.mobile,
}));
vi.mock('src/hooks/use-overview-errands', () => ({ useOverviewErrands: () => overview.value }));
vi.mock('src/hooks/use-status-buttons', () => ({
  useActiveStatusLabel: () => 'Inskickade',
  useStatusButtons: () => ({
    statusButtons: [],
    activeStatus: 'OPEN',
    onSelectStatus: vi.fn(),
  }),
}));
beforeEach(() => {
  state.mobile = false;
  overview.value = {
    rows: [],
    isLoading: false,
    totalPages: 1,
    totalElements: 0,
    hasMore: false,
    loadMore: vi.fn(),
    page: 0,
    errandsError: 'api_errors.errands',
    metadataError: null,
  };
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

  it.each([false, true])('shows the error instead of an empty state on mobile=%s', (mobile) => {
    state.mobile = mobile;
    render(<Overview />);
    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.errands');
    expect(screen.queryByText('errand-information:no_errands')).not.toBeInTheDocument();
  });

  it.each([false, true])('ends the loading announcement when metadata fails on mobile=%s', (mobile) => {
    state.mobile = mobile;
    overview.value.isLoading = true;
    overview.value.errandsError = null;
    overview.value.metadataError = 'api_errors.metadata';
    render(<Overview />);
    expect(screen.getByRole('alert')).toHaveTextContent('api_errors.metadata');
    expect(screen.getByRole('status', { name: 'filtering:reports_heading' })).toBeEmptyDOMElement();
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  });

  it.each([false, true])('announces initial loading without a false empty state on mobile=%s', (mobile) => {
    state.mobile = mobile;
    overview.value.isLoading = true;
    overview.value.errandsError = null;
    render(<Overview />);
    expect(screen.getByRole('status', { name: 'filtering:reports_heading' })).toHaveTextContent(
      'common:errand-table.loading'
    );
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('errand-information:no_errands')).not.toBeInTheDocument();
  });
});
