import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { useFocusTrap } from '@astryxdesign/core/hooks';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { createStakeholderSchema, phoneNumberFormatter, shouldShowContactDetails } from '@utils/stakeholder';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { Controller, Resolver, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';
import * as yup from 'yup';

interface StakeholderFormModalProps {
  index?: number;
  onClose: () => void;
  show: boolean;
  roles: string[];
  initialValues?: StakeholderDTO;
  edit?: boolean;
  editableFields?: (keyof StakeholderDTO)[];
}

// Each opening owns a fresh form and its focus lifecycle.
export const StakeholderFormModal: React.FC<StakeholderFormModalProps> = ({ show, ...props }) =>
  show ? <OpenStakeholderFormModal {...props} /> : null;

const OpenStakeholderFormModal: React.FC<Omit<StakeholderFormModalProps, 'show'>> = ({
  index,
  onClose,
  roles,
  edit,
  initialValues,
  editableFields,
}) => {
  const { t } = useTranslation();
  const showField = (field: keyof StakeholderDTO) => !editableFields || editableFields.includes(field);
  const { metadata } = useMetadataStore();
  const context = useFormContext<ErrandDTO>();

  const { update, append } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  const schema = useMemo(() => {
    // Byggs om när språket ändras – yup fryser felmeddelandena vid konstruktionen.
    const stakeholderSchema = createStakeholderSchema(t);
    if (!editableFields) return stakeholderSchema;
    const fields: Record<string, yup.Schema> = {};
    const fullSchema = stakeholderSchema.describe().fields;
    for (const field of editableFields) {
      if (field in fullSchema) {
        fields[field] = yup.reach(stakeholderSchema, field) as yup.Schema;
      }
    }
    return yup.object(fields);
  }, [editableFields, t]);

  const method = useForm<StakeholderDTO>({
    mode: 'onSubmit',
    resolver: yupResolver(schema) as unknown as Resolver<StakeholderDTO>,
  });

  const { handleSubmit, control, reset } = method;
  const { containerRef, focusFirst } = useFocusTrap<HTMLDialogElement>({ isActive: true });

  // Native close restores the trigger before this per-opening form leaves the DOM.
  useLayoutEffect(() => {
    const dialog = containerRef.current;
    const trigger = document.activeElement;
    return () => {
      if (dialog?.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [containerRef]);

  const defaultRole = roles[0];
  useEffect(() => {
    reset({ role: defaultRole, ...initialValues });
  }, [initialValues, reset, defaultRole]);

  // The form mounts on open; keep the close action focused after the header mounts.
  useEffect(() => {
    focusFirst();
  }, [focusFirst]);

  const onSave = (data: StakeholderDTO) => {
    const merged = editableFields ? { ...initialValues, ...data } : data;
    const stakeholder: StakeholderDTO = { ...merged, phoneNumbers: [phoneNumberFormatter(merged?.phoneNumbers?.[0])] };
    // Går rollen inte att välja får parten avsnittets roll. Tidigare lämnades den tom så snart
    // avsnittet rymde flera roller, och en part utan roll filtreras bort ur listan – den såg
    // ut att aldrig ha lagts till.
    if (!editableFields?.includes('role') && !stakeholder.role) {
      stakeholder.role = roles[0];
    }
    if (edit && index !== undefined) {
      update(index, stakeholder);
    } else {
      append(stakeholder);
    }
    onClose();
  };

  const fields: {
    name: 'firstName' | 'lastName' | 'emails.0' | 'phoneNumbers.0' | 'address' | 'careOf' | 'zipCode' | 'city';
    owner: keyof StakeholderDTO;
    label: string;
    testId: string;
    required?: boolean;
  }[] = [
    {
      name: 'firstName',
      owner: 'firstName',
      label: t('errand-information:stakeholder.modal.first_name'),
      testId: 'modal-firstName-input',
      required: true,
    },
    {
      name: 'lastName',
      owner: 'lastName',
      label: t('errand-information:stakeholder.modal.last_name'),
      testId: 'modal-lastName-input',
      required: true,
    },
    {
      name: 'emails.0',
      owner: 'emails',
      label: t('errand-information:stakeholder.email'),
      testId: 'modal-email-input',
    },
    {
      name: 'phoneNumbers.0',
      owner: 'phoneNumbers',
      label: t('errand-information:stakeholder.phone'),
      testId: 'modal-phone-input',
    },
    {
      name: 'address',
      owner: 'address',
      label: t('errand-information:stakeholder.modal.address'),
      testId: 'modal-address-input',
    },
    {
      name: 'careOf',
      owner: 'careOf',
      label: t('errand-information:stakeholder.modal.care_of'),
      testId: 'modal-careOf-input',
    },
    {
      name: 'zipCode',
      owner: 'zipCode',
      label: t('errand-information:stakeholder.modal.zip_code'),
      testId: 'modal-zipCode-input',
    },
    { name: 'city', owner: 'city', label: t('errand-information:stakeholder.modal.city'), testId: 'modal-city-input' },
  ];
  const roleOptions =
    metadata?.roles
      ?.filter((role) => roles.includes(role.name))
      .map((role) => ({ value: role.name, label: role.displayName })) ?? [];

  return (
    <Dialog
      ref={containerRef}
      data-cy="manual-person-modal"
      isOpen
      width={640}
      purpose="form"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogHeader
        title={
          edit ?
            t('errand-information:stakeholder.modal.edit_title')
          : t('errand-information:stakeholder.modal.add_title')
        }
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />
      <div className="grid min-h-0 min-w-0 gap-4 overflow-y-auto py-4 sm:grid-cols-2">
        {fields
          .filter((field) => showField(field.owner) && (Boolean(field.required) || shouldShowContactDetails(roles)))
          .map((config) => (
            <Controller
              key={config.name}
              control={control}
              name={config.name}
              render={({ field, fieldState }) => (
                <TextInput
                  ref={field.ref}
                  htmlName={field.name}
                  data-cy={config.testId}
                  label={config.label}
                  value={field.value ?? ''}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  isRequired={config.required}
                  isOptional={!config.required}
                  width="100%"
                  status={fieldState.error ? { type: 'error', message: fieldState.error.message } : undefined}
                  statusVariant="detached"
                />
              )}
            />
          ))}
        {showField('role') && (
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="role"
              defaultValue={initialValues?.role ?? roleOptions[0]?.value ?? ''}
              render={({ field, fieldState }) => (
                <Selector
                  data-cy="modal-stakeholder-role-select"
                  label={t('errand-information:stakeholder.modal.role')}
                  value={field.value ?? ''}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  options={roleOptions}
                  isRequired
                  width="100%"
                  status={fieldState.error ? { type: 'error', message: fieldState.error.message } : undefined}
                  statusVariant="detached"
                />
              )}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-3 pt-4">
        <Button
          data-cy="modal-cancel-person-button"
          label={t('errand-information:stakeholder.modal.cancel')}
          variant="secondary"
          onClick={onClose}
        />
        <Button
          data-cy="modal-add-person-button"
          label={
            edit ?
              t('errand-information:stakeholder.modal.save_edit')
            : t('errand-information:stakeholder.modal.save_add')
          }
          variant="primary"
          onClick={(event) => {
            void handleSubmit(onSave)(event);
          }}
        />
      </div>
    </Dialog>
  );
};
