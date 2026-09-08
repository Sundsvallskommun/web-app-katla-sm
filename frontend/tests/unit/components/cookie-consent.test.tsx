import { CookieConsentSection } from '@components/cookie-consent-section/cookie-consent-section.component';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import layout from '../../../locales/sv/layout.json';

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'sv', resources: { sv: { layout } } });
});
afterEach(() => {
  document.cookie = 'SKCookieConsent=; Max-Age=0; Path=/';
});
const showConsent = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <CookieConsentSection />
    </I18nextProvider>
  );

describe('cookie consent', () => {
  it('respects the previously persisted consent after the component-library migration', () => {
    document.cookie = 'SKCookieConsent=necessary%2Cfunc; Path=/';
    showConsent();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(decodeURIComponent(document.cookie)).toContain('SKCookieConsent=necessary,func');
  });

  it('stores necessary-only consent and closes the dialog', async () => {
    const user = userEvent.setup();
    showConsent();
    await user.click(await screen.findByRole('button', { name: 'Godkänn endast nödvändiga' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(decodeURIComponent(document.cookie)).toContain('SKCookieConsent=necessary');
    expect(document.cookie).not.toContain('func');
    expect(document.cookie).not.toContain('stats');
  });

  it('stores individual choices and keeps necessary cookies enabled', async () => {
    const user = userEvent.setup();
    showConsent();
    await user.click(await screen.findByRole('button', { name: 'Hantera kakor' }));
    const necessary = screen.getByRole('checkbox', { name: layout.cookies.necessary.displayName });
    expect(necessary).toBeChecked();
    await user.click(necessary);
    expect(necessary).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: layout.cookies.func.displayName }));
    await user.click(screen.getByRole('button', { name: 'Spara mina val' }));
    expect(decodeURIComponent(document.cookie)).toContain('SKCookieConsent=necessary,func');
    expect(document.cookie).not.toContain('stats');
  });
});
