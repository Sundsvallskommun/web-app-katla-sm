import { ErrandSubmissionProvider } from '@contexts/errand-submission-provider';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import { useErrandSubmission } from '@hooks/use-errand-submission';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

const services = vi.hoisted(() => ({ createErrand: vi.fn(), updateErrand: vi.fn(), push: vi.fn(), toast: vi.fn() }));
vi.mock('@services/errand-service/errand-service', () => services);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: services.push }) }));
vi.mock('@astryxdesign/core/Toast', () => ({ useToast: () => services.toast }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'sv' } }),
}));

function SaveButton({ label }: { label: string }) {
  const { save, isSaving } = useErrandSubmission();
  return (
    <button
      disabled={isSaving}
      onClick={() => {
        void save('DRAFT');
      }}
    >
      {label}
    </button>
  );
}
function Form({ mobile }: { mobile: boolean }) {
  const form = useForm<ErrandFormDTO>({
    defaultValues: {
      status: 'DRAFT',
      errandFormData: [{ schemaName: 'avvikelse-plats-handelse', schemaId: 'lifecycle-v1', data: '{}' }],
    },
  });
  return (
    <FormProvider {...form}>
      <FormValidationProvider>
        <ErrandSubmissionProvider>
          <SaveButton key={mobile ? 'mobile' : 'desktop'} label={mobile ? 'Spara mobil' : 'Spara dator'} />
        </ErrandSubmissionProvider>
      </FormValidationProvider>
    </FormProvider>
  );
}

describe('form-owned submission lifecycle', () => {
  it('keeps a pending write locked across a desktop/mobile presentation change', async () => {
    let complete: (value: ErrandFormDTO) => void = () => {
      throw new Error('Write did not start');
    };
    services.createErrand.mockReturnValue(
      new Promise<ErrandFormDTO>((resolve) => {
        complete = resolve;
      })
    );
    const { rerender } = render(<Form mobile={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Spara dator' }));
    await waitFor(() => {
      expect(services.createErrand).toHaveBeenCalledTimes(1);
    });
    rerender(<Form mobile />);
    const button = screen.getByRole('button', { name: 'Spara mobil' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(services.createErrand).toHaveBeenCalledTimes(1);
    act(() => {
      complete({ id: 'saved', errandNumber: 'TEST-1', status: 'DRAFT', jsonParameters: [] });
    });
    await waitFor(() => {
      expect(services.push).toHaveBeenCalledWith('/arende/TEST-1/grundinformation');
    });
  });
});
