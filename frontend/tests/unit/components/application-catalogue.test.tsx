import { ApplicationCatalogue } from '@components/catalogue/application-catalogue.component';
import { getApplications } from '@services/application-service';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/application-service', () => ({ getApplications: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const get = vi.mocked(getApplications);
const applications = [
  {
    id: 'avvikelse',
    applicationName: 'Avvikelse',
    description: 'Rapportera en avvikelse',
    url: 'https://katla.example/avvikelse',
  },
  {
    id: 'it-bestallning',
    applicationName: 'IT-beställning',
    description: 'Beställ utrustning',
    url: 'https://katla.example/it-bestallning',
  },
];
beforeEach(() => vi.clearAllMocks());

describe('Mina Katlor', () => {
  it('announces loading before the application list arrives', () => {
    get.mockReturnValue(new Promise(() => undefined));
    render(<ApplicationCatalogue />);
    expect(screen.getByRole('status')).toHaveAccessibleName('catalogue:loading');
    expect(screen.queryByText('catalogue:empty_title')).not.toBeInTheDocument();
  });

  it('explains an empty allocation and how to request access', async () => {
    get.mockResolvedValue([]);
    render(<ApplicationCatalogue />);
    expect(await screen.findByRole('heading', { name: 'catalogue:empty_title' })).toBeInTheDocument();
    expect(screen.getByText('catalogue:empty_description')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it.each([1, 2])(
    'renders %i server-authorised destinations with names, descriptions and working URLs',
    async (count) => {
      get.mockResolvedValue(applications.slice(0, count));
      render(<ApplicationCatalogue />);
      const links = await screen.findAllByRole('link');
      expect(links).toHaveLength(count);
      for (const application of applications.slice(0, count)) {
        expect(screen.getByRole('link', { name: new RegExp(application.applicationName) })).toHaveAttribute(
          'href',
          application.url
        );
        expect(screen.getByText(application.description)).toBeInTheDocument();
      }
    }
  );

  it('distinguishes failure from no access and successfully retries', async () => {
    get.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce(applications);
    render(<ApplicationCatalogue />);
    expect(await screen.findByRole('alert')).toHaveTextContent('catalogue:error');
    expect(screen.queryByText('catalogue:empty_title')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'catalogue:retry' }));
    expect(await screen.findByRole('link', { name: /IT-beställning/ })).toHaveAttribute('href', applications[1]?.url);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
