import { List } from '@astryxdesign/core/List';
import { StakeholderRow } from '@components/misc/stakeholder-row.component';
import { ErrandContentLockContext } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import type { ComponentProps } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../../locales/en/errand-information.json';
import sv from '../../../locales/sv/errand-information.json';

const config = vi.hoisted(() => ({ appConfig: { features: { reducedStakeholderInfo: false } } }));
vi.mock('src/config/appconfig', () => config);

const i18n = createInstance();
const person: StakeholderDTO = {
  firstName: 'Alexandra',
  lastName: 'Andersson',
  personNumber: '19900101-1234',
  address: 'Exempelvägen 1',
  city: 'Sundsvall',
  emails: ['alexandra.andersson@example.se'],
  phoneNumbers: ['070-123 45 67'],
};

beforeAll(async () => {
  await i18n.init({
    lng: 'sv',
    fallbackLng: 'sv',
    resources: { sv: { 'errand-information': sv }, en: { 'errand-information': en } },
    interpolation: { escapeValue: false },
  });
});

beforeEach(async () => {
  config.appConfig.features.reducedStakeholderInfo = false;
  await i18n.changeLanguage('sv');
});

const renderPerson = (props: ComponentProps<typeof StakeholderRow>, locked = false) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ErrandContentLockContext value={locked}>
        <List>
          <StakeholderRow {...props} />
        </List>
      </ErrandContentLockContext>
    </I18nextProvider>
  );

describe('person summary', () => {
  it.each([
    ['sv', 'Ta bort Alexandra Andersson'],
    ['en', 'Remove Alexandra Andersson'],
  ])('provides contact links and a named removal action in %s', async (locale, removalName) => {
    await i18n.changeLanguage(locale);
    const onRemove = vi.fn();
    renderPerson({ stakeholder: person, onRemove });

    expect(screen.getByRole('link', { name: 'alexandra.andersson@example.se' })).toHaveAttribute(
      'href',
      'mailto:alexandra.andersson%40example.se'
    );
    expect(screen.getByRole('link', { name: '070-123 45 67' })).toHaveAttribute('href', 'tel:+46701234567');
    // The adjacent name identifies the person; the decorative avatar adds no repeated announcement.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: removalName }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it.each([
    ['PRIMARY', false],
    ['REPORTER', true],
  ])('preserves the contact visibility policy for %s', (role, visible) => {
    config.appConfig.features.reducedStakeholderInfo = true;
    renderPerson({ stakeholder: { ...person, role }, roles: [role] });

    expect(screen.getByText('Alexandra Andersson')).toBeVisible();
    expect(screen.queryAllByRole('link')).toHaveLength(visible ? 2 : 0);
    for (const value of [
      '19900101-1234',
      'Exempelvägen 1 Sundsvall',
      'alexandra.andersson@example.se',
      '070-123 45 67',
    ]) {
      if (visible) expect(screen.getByText(value)).toBeVisible();
      else expect(screen.queryByText(value)).not.toBeInTheDocument();
    }
  });

  it('keeps contact information usable while omitting removal for a locked errand', () => {
    renderPerson({ stakeholder: person, onRemove: vi.fn() }, true);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows missing information as text without creating empty contact links', () => {
    renderPerson({ stakeholder: {} });

    expect(screen.getByText('Namn saknas')).toBeVisible();
    expect(screen.getByText('E-postadress saknas')).toBeVisible();
    expect(screen.getByText('Telefonnummer saknas')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
