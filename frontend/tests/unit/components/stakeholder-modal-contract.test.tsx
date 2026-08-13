import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import type { ContactChannelDTO, ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import primaryPhoneEditContract from '../../../../test-contracts/stakeholder-primary-phone-edit.json';

vi.mock('src/config/appconfig', () => ({
  appConfig: { features: { reducedStakeholderInfo: false } },
}));

interface ChannelWithMetadata extends ContactChannelDTO {
  source: string;
}

const initialContactChannels: ChannelWithMetadata[] = primaryPhoneEditContract.initialStakeholder.contactChannels;

const initialStakeholder: StakeholderDTO = {
  ...primaryPhoneEditContract.initialStakeholder,
  contactChannels: initialContactChannels,
};

const keepModalOpen = () => undefined;

function StakeholderModalHarness() {
  const methods = useForm<ErrandDTO>({
    defaultValues: { stakeholders: [initialStakeholder] },
  });
  const stakeholders = methods.watch('stakeholders');

  return (
    <FormProvider {...methods}>
      <output data-testid="stakeholder-state">{JSON.stringify(stakeholders)}</output>
      <StakeholderFormModal
        edit
        index={0}
        initialValues={initialStakeholder}
        show
        roles={['CONTACT']}
        editableFields={['phoneNumbers']}
        onClose={keepModalOpen}
      />
    </FormProvider>
  );
}

const readStakeholder = (): StakeholderDTO => {
  const parsed: unknown = JSON.parse(screen.getByTestId('stakeholder-state').textContent ?? '[]');
  if (!Array.isArray(parsed) || typeof parsed[0] !== 'object' || parsed[0] === null) {
    throw new Error('Stakeholder form state was not rendered');
  }
  return parsed[0] as StakeholderDTO;
};

describe('StakeholderFormModal wire contract', () => {
  it('preserves secondary phones and raw channel metadata while editing only the primary phone', async () => {
    const user = userEvent.setup();
    render(<StakeholderModalHarness />);

    const saveButton = screen.getByRole('button', { name: 'Ändra uppgifter' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(readStakeholder()).toMatchObject(primaryPhoneEditContract.frontendAfterNoop);
    });

    const primaryPhone = document.querySelector<HTMLInputElement>('[data-cy="modal-phone-input"]');
    if (!primaryPhone) throw new Error('Primary phone input was not rendered');
    await user.clear(primaryPhone);
    await user.type(primaryPhone, primaryPhoneEditContract.primaryPhoneInput);
    await user.click(saveButton);

    await waitFor(() => {
      expect(readStakeholder()).toMatchObject(primaryPhoneEditContract.frontendAfterPrimaryEdit);
    });
  });
});
