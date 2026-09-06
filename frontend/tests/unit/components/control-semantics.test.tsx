import { DropdownMenu, DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import { LanguageItems } from '@components/misc/language-items.component';
import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import { MobileErrandCard } from '@components/mobile/mobile-errand-card.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import NextLink from 'next/link';
import { I18nextProvider } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import commonSv from '../../../locales/sv/common.json';
import layoutSv from '../../../locales/sv/layout.json';

const routerPushMock = vi.hoisted(() => vi.fn());
const pathnameMock = vi.hoisted(() => ({ value: '/oversikt' }));
const searchParamsMock = vi.hoisted(() => ({ value: '' }));
const colorSchemeStoreMock = vi.hoisted(() => ({
  colorScheme: 'system',
  setColorScheme: vi.fn(),
}));
const i18n = createInstance();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
  usePathname: () => pathnameMock.value,
  useSearchParams: () => new URLSearchParams(searchParamsMock.value),
}));

vi.mock('@utils/use-localstorage.hook', () => ({
  useLocalStorage: () => colorSchemeStoreMock,
}));

const renderLocalized = (component: React.ReactNode) =>
  render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);

describe('control semantics', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'sv',
      resources: {
        sv: {
          common: commonSv,
          layout: layoutSv,
        },
      },
      defaultNS: 'layout',
      ns: ['layout', 'common'],
    });
  });

  afterEach(() => {
    routerPushMock.mockReset();
    pathnameMock.value = '/oversikt';
    searchParamsMock.value = '';
    colorSchemeStoreMock.colorScheme = 'system';
    colorSchemeStoreMock.setColorScheme.mockReset();
    act(() => {
      useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
    });
  });

  it('keeps the application menu actions keyboard-addressable', async () => {
    renderLocalized(
      <AppUserMenu initials="AE" menuTitle="Ada Exempel" menuGroups={createUserMenuGroups(i18n.t)} buttonSize="md" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Öppna användarmeny' }));
    const logout = await screen.findByRole('menuitem', { name: 'Logga ut' });

    expect(logout).toHaveAttribute('tabindex');
    fireEvent.click(logout);
    expect(routerPushMock).toHaveBeenCalledWith('/logout');
  });

  it('gives the user menu trigger a functional accessible name', () => {
    renderLocalized(
      <AppUserMenu
        data-testid="user-menu"
        initials="AE"
        menuTitle="Ada Exempel"
        menuGroups={[
          {
            label: 'Kontroller',
            elements: [{ label: 'Inställningar', element: () => <DropdownMenuItem label="Inställningar" /> }],
          },
        ]}
        buttonSize="md"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Öppna användarmeny' }));

    expect(screen.getByRole('menuitem', { name: 'Inställningar' })).toBeVisible();
    expect(screen.getByTestId('user-menu')).toContainElement(
      screen.getByRole('button', { name: 'Öppna användarmeny' })
    );
  });

  it('exposes notification count and expanded state without a false menu-item role', () => {
    const toggleShow = vi.fn();
    useNotificationStore.setState({ activeNotifications: [{ id: 'notification-1' }] });

    renderLocalized(<NotificationsBell expanded toggleShow={toggleShow} />);

    const button = screen.getByRole('button', { name: 'Öppna notifieringar (1 oläst)' });
    expect(button).toHaveAttribute('aria-controls', 'notifications-panel');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(toggleShow).toHaveBeenCalledOnce();
  });

  it('renders mobile errand navigation as one named link', () => {
    renderLocalized(
      <MobileErrandCard
        errand={{
          errandNumber: 'AIA-25120019',
          status: 'NEW',
          created: '2026-08-12T08:00:00Z',
        }}
      />
    );

    const link = screen.getByRole('link', { name: 'Öppna ärende AIA-25120019' });
    expect(link).toHaveAttribute('href', '/arende/AIA-25120019/grundinformation');
    expect(link.querySelector('button')).not.toBeInTheDocument();
  });

  it('keeps the design-system tab identity while rendering a single link', () => {
    render(
      <TabList value="information" onChange={() => undefined} aria-label="Ärende">
        <Tab value="information" label="Grundinformation" as={NextLink} href="/arende/ett/grundinformation" />
      </TabList>
    );

    const tab = screen.getByRole('link', { name: 'Grundinformation' });
    expect(tab.tagName).toBe('A');
    expect(tab).toHaveAttribute('href', '/arende/ett/grundinformation');
    expect(tab.querySelector('button')).not.toBeInTheDocument();
  });

  it('exposes color modes as one radio set without closing after a selection', () => {
    renderLocalized(
      <DropdownMenu isMenuOpen button={{ label: 'Färgläge' }}>
        <ColorSchemeItems />
      </DropdownMenu>
    );

    const light = screen.getByRole('menuitemradio', { name: 'Ljust' });
    const dark = screen.getByRole('menuitemradio', { name: 'Mörkt' });
    const system = screen.getByRole('menuitemradio', { name: 'System' });

    const group = screen.getByRole('group', { name: 'Färgläge' });
    expect([light, dark, system].every((radio) => group.contains(radio))).toBe(true);
    expect(system).toBeChecked();

    fireEvent.click(light);

    expect(colorSchemeStoreMock.setColorScheme).toHaveBeenCalledWith('light');
    expect(screen.getByRole('menuitemradio', { name: 'Mörkt' })).toBeVisible();
  });

  it('exposes languages by their native names as one radio set', () => {
    renderLocalized(
      <DropdownMenu isMenuOpen button={{ label: 'Språk' }}>
        <LanguageItems />
      </DropdownMenu>
    );

    // Namnen står på språket självt så att en användare som inte läser svenska
    // känner igen sitt eget språk i menyn.
    const swedish = screen.getByRole('menuitemradio', { name: 'Svenska' });
    const english = screen.getByRole('menuitemradio', { name: 'English' });

    const group = screen.getByRole('group', { name: 'Språk' });
    expect(group).toContainElement(swedish);
    expect(group).toContainElement(english);
    expect(swedish).toBeChecked();
    expect(english.querySelector('[lang="en"]')).toHaveTextContent('English');
  });

  it('switches language by navigating to the same page under an explicit locale prefix', () => {
    pathnameMock.value = '/arende/AIA-25120019/grundinformation';

    renderLocalized(
      <DropdownMenu isMenuOpen button={{ label: 'Språk' }}>
        <LanguageItems />
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    // Samma sida, inte en återgång till startsidan – annars tappar användaren sin plats.
    expect(routerPushMock).toHaveBeenCalledWith('/en/arende/AIA-25120019/grundinformation');
  });

  it('keeps the query string when switching language', () => {
    pathnameMock.value = '/login';
    searchParamsMock.value = 'path=%2Farende%2FAIA-25120019%2Fgrundinformation&failMessage=NOT_AUTHORIZED';

    renderLocalized(
      <DropdownMenu isMenuOpen button={{ label: 'Språk' }}>
        <LanguageItems />
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    // Inloggningen läser ?path för vart användaren ska tillbaka efteråt och ?failMessage
    // för felet som ska visas. Ett språkbyte som tappar frågesträngen skickar användaren
    // till översikten i stället för till sidan hen försökte nå.
    expect(routerPushMock).toHaveBeenCalledWith(
      '/en/login?path=%2Farende%2FAIA-25120019%2Fgrundinformation&failMessage=NOT_AUTHORIZED'
    );
  });

  it('reaches the language choice from the header without opening the user menu', async () => {
    renderLocalized(<LanguageSwitchButton />);

    // Koden i knappen är en kompakt visuell form; det tillgängliga namnet skriver ut språket,
    // eftersom "SV" inte säger något för den som inte redan känner igen koden.
    const trigger = screen.getByRole('button', { name: 'Byt språk. Valt språk: Svenska' });
    expect(trigger).toHaveTextContent('SV');

    fireEvent.click(trigger);

    expect(await screen.findByRole('menuitemradio', { name: 'Svenska' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeVisible();
  });

  it('keeps the header language list in its own radio group', async () => {
    renderLocalized(<LanguageSwitchButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Byt språk. Valt språk: Svenska' }));

    expect(await screen.findByRole('group', { name: 'Språk' })).toHaveAttribute('id', 'header-language');
  });
});
