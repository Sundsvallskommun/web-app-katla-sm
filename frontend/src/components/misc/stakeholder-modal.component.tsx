import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { phoneNumberFormatter, stakeholderSchema } from '@utils/stakeholder';
import { useEffect } from 'react';
import { Resolver, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderFormModal: React.FC<{
  index?: number;
  onClose: () => void;
  show: boolean;
  roles: string[];
  initialValues?: StakeholderDTO;
  edit?: boolean;
}> = ({ index, onClose, show, roles, edit, initialValues }) => {
  const { metadata } = useMetadataStore();
  const context = useFormContext<ErrandDTO>();

  const { update, append } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  const method = useForm<StakeholderDTO>({
    mode: 'onSubmit',
    resolver: yupResolver(stakeholderSchema) as unknown as Resolver<StakeholderDTO>,
  });

  const { handleSubmit, register, reset, formState } = method;

  useEffect(() => {
    reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const onSave = (data: StakeholderDTO) => {
    const stakeholder: StakeholderDTO = { ...data, phoneNumbers: [phoneNumberFormatter(data?.phoneNumbers?.[0])] };
    if (edit && index !== undefined) {
      update(index, stakeholder);
    } else {
      append(stakeholder);
    }
    onClose();
  };

  return (
    <Modal
      data-cy="manual-person-modal"
      show={show}
      onClose={onClose}
      label={edit ? `Redigera person` : 'Lägg till person manuellt'}
      className="w-full max-w-[calc(100vw-3.2rem)] md:max-w-[72rem] max-h-[calc(100dvh-3.2rem)]"
    >
      <Modal.Content className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-2">
        {edit && (
          <FormControl className="w-full min-w-0">
            <FormLabel>Personnummer</FormLabel>
            <Input className="w-full" data-cy="modal-personNumber-input" {...register(`personNumber`)} readOnly />
          </FormControl>
        )}
        <div className="flex flex-col md:flex-row gap-8">
          <FormControl required className="w-full min-w-0">
            <FormLabel>Förnamn</FormLabel>
            <Input className="w-full" data-cy="modal-firstName-input" {...register(`firstName`)} />
            {formState.errors.firstName && (
              <FormErrorMessage data-cy="firstName-input-error">{formState.errors.firstName.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl required className="w-full min-w-0">
            <FormLabel>Efternamn</FormLabel>
            <Input className="w-full" data-cy="modal-lastName-input" {...register(`lastName`)} />
            {formState.errors.lastName && (
              <FormErrorMessage data-cy="lastName-input-error">{formState.errors.lastName.message}</FormErrorMessage>
            )}
          </FormControl>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <FormControl className="w-full min-w-0">
            <FormLabel>E-postadress</FormLabel>
            <Input className="w-full" data-cy="modal-email-input" {...register('emails.0')} />
            {formState.errors.emails?.[0]?.message && (
              <FormErrorMessage data-cy="modal-email-input-error">
                {formState.errors.emails[0].message}
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl className="w-full min-w-0">
            <FormLabel>Telefonnummer</FormLabel>
            <Input className="w-full" data-cy="modal-phone-input" {...register('phoneNumbers.0')} />
            {formState.errors.phoneNumbers?.[0]?.message && (
              <FormErrorMessage data-cy="modal-phone-input-error" className="break-words">
                {formState.errors.phoneNumbers[0].message}
              </FormErrorMessage>
            )}
          </FormControl>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <FormControl className="w-full min-w-0">
            <FormLabel>Adress</FormLabel>
            <Input className="w-full" data-cy="modal-address-input" {...register(`address`)} />
          </FormControl>
          <FormControl className="w-full min-w-0">
            <FormLabel>C/o adress</FormLabel>
            <Input className="w-full" data-cy="modal-careOf-input" {...register(`careOf`)} />
          </FormControl>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <FormControl className="w-full min-w-0">
            <FormLabel>Postnummer</FormLabel>
            <Input className="w-full" data-cy="modal-zipCode-input" {...register(`zipCode`)} />
          </FormControl>
          <FormControl className="w-full min-w-0">
            <FormLabel>Ort</FormLabel>
            <Input className="w-full" data-cy="modal-city-input" {...register(`city`)} />
          </FormControl>
        </div>

        <div className="flex flex-col">
          <FormControl required className="w-full">
            <FormLabel>Roll</FormLabel>
            <Select data-cy="modal-stakeholder-role-select" className="w-full" {...register(`role`)}>
              {metadata?.roles?.map(
                (role) =>
                  roles?.includes(role.name) && (
                    <Select.Option key={role.name} value={role.name}>
                      {role.displayName}
                    </Select.Option>
                  )
              )}
            </Select>
          </FormControl>
        </div>
      </Modal.Content>

      <Modal.Footer className="sticky bottom-0 z-10 bg-background-content pt-8 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] flex flex-col-reverse sm:flex-row sm:justify-end w-full">
        <Button data-cy="modal-cancel-person-button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
          Avbryt
        </Button>
        <Button
          data-cy="modal-add-person-button"
          variant="primary"
          className="w-full sm:w-auto"
          onClick={handleSubmit(onSave)}
        >
          {edit ? 'Ändra uppgifter' : 'Lägg till'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
