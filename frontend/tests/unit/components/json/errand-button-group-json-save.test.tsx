import { WizardBottomBar } from '@components/wizard/wizard-bottom-bar.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import type { LabelDTO } from '@data-contracts/backend/data-contracts';
import type { ErrandFormDTO } from '@interfaces/errand-form';
import { ErrandButtonGroup } from '@layouts/errand-button-group.component';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createErrandMock, routerPushMock, snackbarMock, updateErrandMock } = vi.hoisted(() => ({
  createErrandMock: vi.fn(),
  routerPushMock: vi.fn(),
  snackbarMock: vi.fn(),
  updateErrandMock: vi.fn(),
}));

vi.mock('@components/cancel-errand-dialog.component', () => ({
  CancelErrandDialog: () => null,
}));

// Det här testet gäller sparakontraktet; native modalitet verifieras i browserfallen.
vi.mock('@components/modal-layer/modal-layer.component', () => ({
  ModalLayer: () => null,
}));

vi.mock('@services/errand-service/errand-service', () => ({
  createErrand: createErrandMock,
  updateErrand: updateErrandMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'sv' } }),
}));

vi.mock('src/config/appconfig', () => ({
  appConfig: { features: { draftEnabled: true } },
}));

vi.mock('@sk-web-gui/react', () => {
  const Button = ({ children, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
  const Dialog = ({ children, show }: { children?: ReactNode; show?: boolean }) =>
    show ? <div>{children}</div> : null;
  function DialogContent({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }
  function DialogButtons({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }
  Dialog.Content = DialogContent;
  Dialog.Buttons = DialogButtons;

  const Link = ({ children, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );

  return {
    Button,
    Dialog,
    Link,
    useSnackbar: () => snackbarMock,
  };
});

const rootLabel: LabelDTO = {
  id: 'root',
  resourceName: 'LOCATION',
  resourcePath: 'LOCATION',
  displayName: 'Platsstruktur',
  classification: 'location-root',
};
const leafLabel: LabelDTO = {
  id: 'leaf',
  resourceName: 'UNIT',
  resourcePath: 'LOCATION/UNIT',
  displayName: 'Enhet',
  classification: 'place',
};

function TestForm({ data = '{invalid-json', wizard = false }: { data?: string; wizard?: boolean }) {
  const methods = useForm<ErrandFormDTO>({
    defaultValues: {
      status: 'DRAFT',
      errandFormData: [
        {
          schemaName: 'avvikelse-plats-handelse',
          schemaId: 'schema-v1',
          data,
        },
      ],
    },
  });

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        {wizard ?
          <WizardBottomBar />
        : <ErrandButtonGroup isNewErrand />}
      </FormValidationProvider>
    </FormProvider>
  );
}

describe.each([false, true])('Draft save contract (wizard: %s)', (wizard) => {
  const saveButtonName = wizard ? 'errand-information:wizard.save' : 'errand-information:save_draft';
  beforeEach(() => {
    createErrandMock.mockReset();
    routerPushMock.mockReset();
    snackbarMock.mockReset();
    updateErrandMock.mockReset();
    useMetadataStore.setState({ metadata: { labels: { labelStructure: [{ ...rootLabel, labels: [leafLabel] }] } } });
  });

  it('handles invalid persisted JSON without calling the save API', async () => {
    render(<TestForm wizard={wizard} />);

    fireEvent.click(screen.getByRole('button', { name: saveButtonName }));

    await waitFor(() => {
      expect(snackbarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'invalid_form_data',
        })
      );
    });
    expect(createErrandMock).not.toHaveBeenCalled();
    expect(updateErrandMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it.each([{}, { facilityInfo: {} }, { facilityInfo: { orgName: 'Okänd' } }])(
    'blocks a draft without a valid place: %j',
    async (data) => {
      render(<TestForm wizard={wizard} data={JSON.stringify(data)} />);
      fireEvent.click(screen.getByRole('button', { name: saveButtonName }));

      await waitFor(() => {
        expect(snackbarMock).toHaveBeenCalledWith({
          position: 'bottom',
          status: 'error',
          message: 'errand-information:about.facility_required_to_save',
        });
      });
      expect(createErrandMock).not.toHaveBeenCalled();
      expect(updateErrandMock).not.toHaveBeenCalled();
    }
  );

  it('saves a draft with the full location chain while other form fields are still empty', async () => {
    createErrandMock.mockResolvedValue({ id: 'created', errandNumber: 'ERRAND-1', jsonParameters: [] });
    render(<TestForm wizard={wizard} data={JSON.stringify({ facilityInfo: { orgName: 'Enhet' } })} />);
    fireEvent.click(screen.getByRole('button', { name: saveButtonName }));

    await waitFor(() => {
      expect(createErrandMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DRAFT',
          labels: [rootLabel, leafLabel],
        })
      );
    });
  });
});
