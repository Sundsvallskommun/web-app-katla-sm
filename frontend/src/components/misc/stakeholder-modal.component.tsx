import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { useEffect } from 'react';
import { useFieldArray, useForm, useFormContext } from 'react-hook-form';

export const StakeholderFormModal: React.FC<{
  index?: number;
  onClose: () => void;
  show: boolean;
  //   roles: Role[];
  initialValues?: StakeholderDTO;
  edit?: boolean;
}> = ({ index, onClose, show, edit, initialValues }) => {
  const context = useFormContext<ErrandDTO>();

  const { update, append } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  const method = useForm<StakeholderDTO>({
    mode: 'onSubmit',
  });

  const { handleSubmit, register, setValue, reset, watch } = method;

  useEffect(() => {
    reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const onSave = (data: StakeholderDTO) => {
    if (edit && index !== undefined) {
      update(index, data);
    } else {
      append(data);
    }
    onClose();
  };

  const contactChannels = watch(`contactChannels`) ?? [];
  const existingEmail = contactChannels.find((c) => c.type === 'EMAIL')?.value ?? '';
  const existingPhone = contactChannels.find((c) => c.type === 'PHONE')?.value ?? '';

  const updateContactChannel = (type: string, value: string) => {
    const current = contactChannels;
    const updated = [...current.filter((c) => c.type !== type), { type, value }];
    setValue(`contactChannels`, updated, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Modal
      data-cy="manual-person-modal"
      className="w-full max-w-[48rem]"
      show={show}
      onClose={onClose}
      label={edit ? `Redigera person` : 'Lägg till person manuellt'}
    >
      <Modal.Content>
        <FormControl>
          <FormLabel>Personnummer</FormLabel>
          <Input {...register(`personNumber`)} readOnly={true} />
        </FormControl>
        <div className="flex gap-8">
          <FormControl required>
            <FormLabel>Förnamn</FormLabel>
            <Input {...register(`firstName`)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
          <FormControl required>
            <FormLabel>Efternamn</FormLabel>
            <Input {...register(`lastName`)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
        </div>

        <div className="flex gap-8">
          <FormControl>
            <FormLabel>E-postadress</FormLabel>
            <Input value={existingEmail} onChange={(e) => updateContactChannel('EMAIL', e.target.value)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Telefonnummer</FormLabel>
            <Input value={existingPhone} onChange={(e) => updateContactChannel('PHONE', e.target.value)} />

            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
        </div>

        <div className="flex gap-8">
          <FormControl readOnly={true} required={true}>
            <FormLabel>Adress</FormLabel>
            <Input {...register(`address`)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>C/o adress</FormLabel>
            <Input {...register(`careOf`)} />
          </FormControl>
        </div>

        <div className="flex gap-8">
          <FormControl readOnly={true} required={true}>
            <FormLabel>Postnummer</FormLabel>
            <Input {...register(`zipCode`)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
          <FormControl readOnly={true} required={true}>
            <FormLabel>Ort</FormLabel>
            <Input {...register(`city`)} />
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
          </FormControl>
        </div>

        <div className="flex flex-col">
          <FormControl required>
            <FormLabel>Roll</FormLabel>
            <Select data-cy="modal-stakeholder-role-select" {...register(`role`)}>
              <Select.Option>Välj roll</Select.Option>
              {/* {roles.map((role) => (
                <Select.Option key={role} value={role}>
                  {RoleDisplayNames[role]}
                </Select.Option>
              ))} */}
            </Select>
            <FormErrorMessage className="text-error">{}</FormErrorMessage>
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
