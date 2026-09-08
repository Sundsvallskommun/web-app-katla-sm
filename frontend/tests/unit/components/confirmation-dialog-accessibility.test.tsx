import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import { WizardBottomBar } from '@components/wizard/wizard-bottom-bar.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import type { ErrandFormDTO } from '@interfaces/errand-form';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';
import { useWizardStore } from 'src/stores/wizard-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import errandEn from '../../../locales/en/errand-information.json';
import errandSv from '../../../locales/sv/errand-information.json';

const services = vi.hoisted(() => ({
  createErrand: vi.fn(),
  updateErrand: vi.fn(),
  push: vi.fn(),
  snackbar: vi.fn(),
}));

vi.mock('@services/errand-service/errand-service', () => services);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: services.push }) }));
vi.mock('@astryxdesign/core/Toast', () => ({ useToast: () => services.snackbar }));

const i18n = createInstance();

beforeEach(async () => {
  vi.clearAllMocks();
  useWizardStore.setState({ currentStep: 4, stepErrors: {} });
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ schemaId: 'confirmation-accessibility:1', schema: { type: 'object' }, uiSchema: {} }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      )
  );
  await i18n.init({
    lng: 'sv',
    resources: { sv: { 'errand-information': errandSv }, en: { 'errand-information': errandEn } },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  act(() => {
    useWizardStore.getState().reset();
  });
});

function CancelHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Öppna avbrytdialog
      </button>
      <CancelErrandDialog
        show={open}
        onClose={() => {
          setOpen(false);
        }}
        onConfirm={services.push}
      />
    </>
  );
}

function SubmitHarness({ wizard }: { wizard: boolean }) {
  const form = useForm<ErrandFormDTO>({
    defaultValues: {
      status: 'DRAFT',
      parameters: [
        { key: 'eventType', values: ['AVVIKELSE'] },
        { key: 'eventConcerns', values: ['ENSKILD_BRUKARE'] },
      ],
      stakeholders: [{ role: 'PRIMARY' }],
      errandFormData: [
        { schemaName: 'avvikelse-plats-handelse', schemaId: 'confirmation-accessibility:1', data: '{}' },
      ],
    },
  });

  return (
    <FormProvider {...form}>
      <FormValidationProvider>
        {wizard ?
          <WizardBottomBar />
        : <ErrandButtonGroup isNewErrand />}
      </FormValidationProvider>
    </FormProvider>
  );
}

describe('confirmation dialog accessibility', () => {
  it.each(['sv', 'en'])(
    'names cancellation from its one visible heading and closes with Escape in %s',
    async (locale) => {
      await i18n.changeLanguage(locale);
      const user = userEvent.setup();
      render(
        <I18nextProvider i18n={i18n}>
          <CancelHarness />
        </I18nextProvider>
      );
      const trigger = screen.getByRole('button', { name: 'Öppna avbrytdialog' });
      await user.click(trigger);

      const name = i18n.t('errand-information:cancel_confirm.title');
      const dialog = await screen.findByRole('dialog', { name });
      expect(within(dialog).getAllByRole('heading', { name })).toHaveLength(1);
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(trigger).toHaveFocus();
      expect(services.push).not.toHaveBeenCalled();
    }
  );

  it.each([false, true])('names the submission dialog and closes without submitting (wizard: %s)', async (wizard) => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <SubmitHarness wizard={wizard} />
      </I18nextProvider>
    );
    const trigger = screen.getByRole('button', { name: wizard ? /^Skicka$/ : /^Skicka rapport$/ });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Skicka rapporten?' });
    expect(within(dialog).getAllByRole('heading', { name: 'Skicka rapporten?' })).toHaveLength(1);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
    expect(services.createErrand).not.toHaveBeenCalled();
    expect(services.updateErrand).not.toHaveBeenCalled();
    expect(services.push).not.toHaveBeenCalled();
  });
});
