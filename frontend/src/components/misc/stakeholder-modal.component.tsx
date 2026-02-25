import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { phoneNumberFormatter, stakeholderSchema } from '@utils/stakeholder';
import { useEffect } from 'react';
import { Resolver, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { appConfig } from 'src/config/appconfig';
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
    >
      <Modal.Content>
        <FormControl>
          <FormLabel>Personnummer</FormLabel>
          <Input data-cy="modal-personNumber-input" {...register(`personNumber`)} readOnly />
        </FormControl>
        <div className="flex gap-8">
          <FormControl required>
            <FormLabel>Förnamn</FormLabel>
            <Input data-cy="modal-firstName-input" {...register(`firstName`)} />
            {formState.errors.firstName && (
              <FormErrorMessage data-cy="firstName-input-error">{formState.errors.firstName.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl required>
            <FormLabel>Efternamn</FormLabel>
            <Input data-cy="modal-lastName-input" {...register(`lastName`)} />
            {formState.errors.lastName && (
              <FormErrorMessage data-cy="lastName-input-error">{formState.errors.lastName.message}</FormErrorMessage>
            )}
          </FormControl>
        </div>

        {!(roles?.includes('PRIMARY') && appConfig.features.reducedStakeholderInfo) && (
          <>
            <div className="flex gap-8">
              <FormControl>
                <FormLabel>E-postadress</FormLabel>
                <Input data-cy="modal-email-input" {...register('emails.0')} />
                {formState.errors.emails?.[0]?.message && (
                  <FormErrorMessage data-cy="modal-email-input-error">
                    {formState.errors.emails[0].message}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Telefonnummer</FormLabel>
                <Input data-cy="modal-phone-input" {...register('phoneNumbers.0')} />
                {formState.errors.phoneNumbers?.[0]?.message && (
                  <FormErrorMessage data-cy="modal-phone-input-error" className="max-w-[22.9rem] truncate">
                    {formState.errors.phoneNumbers[0].message}
                  </FormErrorMessage>
                )}
              </FormControl>
            </div>

            <div className="flex gap-8">
              <FormControl>
                <FormLabel>Adress</FormLabel>
                <Input data-cy="modal-address-input" {...register(`address`)} />
              </FormControl>
              <FormControl>
                <FormLabel>C/o adress</FormLabel>
                <Input data-cy="modal-careOf-input" {...register(`careOf`)} />
              </FormControl>
            </div>

            <div className="flex gap-8">
              <FormControl>
                <FormLabel>Postnummer</FormLabel>
                <Input data-cy="modal-zipCode-input" {...register(`zipCode`)} />
              </FormControl>
              <FormControl>
                <FormLabel>Ort</FormLabel>
                <Input data-cy="modal-city-input" {...register(`city`)} />
              </FormControl>
            </div>
          </>
        )}

        <div className="flex flex-col">
          <FormControl required>
            <FormLabel>Roll</FormLabel>
            <Select data-cy="modal-stakeholder-role-select" {...register(`role`)}>
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

      <Modal.Footer>
        <Button data-cy="modal-cancel-person-button" variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button data-cy="modal-add-person-button" variant="primary" onClick={handleSubmit(onSave)}>
          {edit ? 'Ändra uppgifter' : 'Lägg till'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
