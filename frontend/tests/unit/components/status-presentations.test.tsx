import { CreatedErrand } from '@components/errand-pages/created-errand.component';
import { StatusLabel } from '@components/misc/status-label.component';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import commonEn from '../../../locales/en/common.json';
import commonSv from '../../../locales/sv/common.json';

vi.mock('@components/errand-pages/errand-form-sections.component', () => ({
  ErrandFormSections: () => <div>Ärendets uppgifter</div>,
}));

const i18n = createInstance();
const readOnlyNotice = 'Ärendet är inskickat och uppgifterna kan inte ändras.';

beforeEach(async () => {
  await i18n.init({
    lng: 'sv',
    resources: {
      sv: { common: commonSv, 'errand-information': { read_only: { notice: readOnlyNotice } } },
      en: { common: commonEn },
    },
  });
  useMetadataStore.setState({
    metadata: {
      statuses: [
        { name: 'NEW', displayName: 'Ny', externalDisplayName: 'Mottagen av kommunen' },
        { name: 'SPECIAL_REVIEW', externalDisplayName: 'Särskild granskning' },
      ],
    },
  });
});

afterEach(() => {
  useMetadataStore.setState({ metadata: null });
});

describe('errand status presentation', () => {
  it('keeps metadata names visible without announcing passive status badges as live messages', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <StatusLabel status="NEW" />
        <StatusLabel status="SPECIAL_REVIEW" />
      </I18nextProvider>
    );

    expect(screen.getByText('Mottagen av kommunen')).toBeVisible();
    expect(screen.getByText('Särskild granskning')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('updates translated names when the language changes and keeps the status icon decorative', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <StatusLabel status="SOLVED" />
      </I18nextProvider>
    );

    expect(screen.getByText('Avslutad')).toBeVisible();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.getByText('Closed')).toBeVisible();
    expect(screen.queryByText('Avslutad')).not.toBeInTheDocument();
  });

  it('shows one polite explanation only after the errand becomes locked', async () => {
    const user = userEvent.setup();
    function ErrandLifecycle() {
      const methods = useForm({ defaultValues: { status: 'DRAFT' } });
      return (
        <FormProvider {...methods}>
          <CreatedErrand />
          <button
            type="button"
            onClick={() => {
              methods.setValue('status', 'NEW');
            }}
          >
            Lämna in
          </button>
        </FormProvider>
      );
    }

    render(
      <I18nextProvider i18n={i18n}>
        <ErrandLifecycle />
      </I18nextProvider>
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Ärendets uppgifter')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Lämna in' }));

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(readOnlyNotice);
    expect(notice).toHaveAttribute('data-cy', 'read-only-notice');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByText(readOnlyNotice)).toHaveLength(1);
  });
});
