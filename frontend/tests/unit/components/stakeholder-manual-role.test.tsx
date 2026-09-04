import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const EDITABLE_WITHOUT_ROLE = ['personNumber', 'firstName', 'lastName', 'emails', 'phoneNumbers'] as const;

function Stakeholders() {
  const { watch } = useFormContext<ErrandDTO>();
  const stakeholders = watch('stakeholders') ?? [];

  return (
    <span data-testid="roles">{stakeholders.map((stakeholder) => stakeholder.role ?? 'ingen roll').join(',')}</span>
  );
}

function ModalHost({ roles }: { roles: string[] }) {
  const methods = useForm<ErrandDTO>({ defaultValues: { stakeholders: [] } });

  return (
    <FormProvider {...methods}>
      <Stakeholders />
      <StakeholderFormModal show roles={roles} editableFields={[...EDITABLE_WITHOUT_ROLE]} onClose={() => undefined} />
    </FormProvider>
  );
}

/**
 * Rollen går inte att välja i avsnitt där den sätts automatiskt. Parten måste ändå få avsnittets
 * roll: listan visar bara parter vars roll den känner igen, så en part utan roll försvinner och
 * ser ut att aldrig ha lagts till.
 */
describe('manually added stakeholder', () => {
  it('marks contact details as optional while names remain required', () => {
    render(<ModalHost roles={['CONTACT']} />);

    expect(screen.getByRole('textbox', { name: /stakeholder.email optional_label/ })).not.toBeRequired();
    expect(screen.getByRole('textbox', { name: /stakeholder.phone optional_label/ })).not.toBeRequired();
    expect(screen.getByRole('textbox', { name: /modal.first_name/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /modal.last_name/ })).toBeRequired();
    expect(screen.getAllByText('optional_label')).toHaveLength(2);
  });

  it.each([
    ['a section with one role', ['CONTACT'], 'CONTACT'],
    ['a section with several roles', ['CONTACT', 'SUBSTITUTEASSIGNMENT'], 'CONTACT'],
  ])('gets the role of %s', async (_label, roles, expectedRole) => {
    const user = userEvent.setup();
    render(<ModalHost roles={roles} />);

    await user.type(screen.getByLabelText(/first_name/), 'Kim');
    await user.type(screen.getByLabelText(/last_name/), 'Kollega');
    // Testbiblioteket letar efter data-testid; knapparna märks med data-cy i den här appen.
    const saveButton = document.querySelector('[data-cy="modal-add-person-button"]');
    await user.click(saveButton as HTMLElement);

    expect(await screen.findByTestId('roles')).toHaveTextContent(expectedRole);
  });
});
