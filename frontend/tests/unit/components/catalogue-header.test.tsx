import { AppHeader } from '@layouts/app-header.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appConfig } from 'src/config/appconfig';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ translate: (key: string) => key }));
vi.mock('src/config/appconfig', () => ({
  appConfig: { mode: 'catalogue', applicationName: 'Mina Katlor', catalogueUrl: undefined },
  applicationStorageScope: 'catalogue:test',
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: mocks.translate, i18n: { resolvedLanguage: 'sv' } }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/katlor',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@services/errand-service/errand-service', () => ({
  getNotifications: vi.fn().mockResolvedValue([]),
  acknowledgeNotification: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  appConfig.mode = 'catalogue';
  appConfig.applicationName = 'Mina Katlor';
  appConfig.catalogueUrl = undefined;
});

describe('catalogue navigation', () => {
  it('keeps the user and language controls without loading case notifications', () => {
    render(<AppHeader logoHref="/katlor" />);
    expect(screen.getByRole('navigation', { name: 'Mina Katlor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'layout:controls.open_user_menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'layout:language.switch' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'layout:notifications.open' })).not.toBeInTheDocument();
    expect(getNotifications).not.toHaveBeenCalled();
  });

  it('offers a configured way back to Mina Katlor inside a Katla', async () => {
    appConfig.mode = 'katla';
    appConfig.applicationName = 'Avvikelse';
    appConfig.catalogueUrl = 'https://katla.example/portal';
    render(<AppHeader logoHref="/oversikt" />);
    await userEvent.click(screen.getByRole('button', { name: 'layout:controls.open_user_menu' }));
    expect(screen.getByRole('menuitem', { name: 'catalogue:title' })).toHaveAttribute(
      'href',
      'https://katla.example/portal'
    );
    expect(await screen.findByRole('button', { name: 'layout:notifications.open' })).toBeInTheDocument();
  });
});
