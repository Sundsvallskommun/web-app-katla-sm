import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getStakeholderUsingPersonNumber } from '@services/citizen/citizen-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, cx, FormControl, FormErrorMessage, FormLabel, Input, SearchField, Select } from '@sk-web-gui/react';
import { useState } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { StakeholderFormModal } from './stakeholder-modal.component';

export const StakeholderList: React.FC<{
  roles?: string[];
}> = () => {
  const [searchResult, setSearchResult] = useState<boolean>(false);
  const [manualEntryOpen, setManualEntryOpen] = useState<boolean>(false);

  const context = useFormContext<ErrandDTO>();

  const { stakeholders } = context.watch();

  const { append, remove } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  const method = useForm<StakeholderDTO>({
    // defaultValues: { ...emptyCasedataOwnerOrContact },
    mode: 'onSubmit',
    // resolver: yupResolver(stakeholderSchema) as unknown as Resolver<CasedataOwnerOrContact>,
  });

  const { handleSubmit, register, watch, setValue, getValues, reset } = method;

  const { firstName, lastName, personNumber, address, city } = watch();

  const onSearchHandler = (query: string) => {
    getStakeholderUsingPersonNumber(query).then((res) => {
      reset(res);
      setSearchResult(true);
    });
  };

  const addStakeholderToErrand = (stakeholder: StakeholderDTO) => {
    append({ ...stakeholder, externalIdType: 'PERSON' });

    setSearchResult(false);
  };

  const updateContactChannel = (type: string, value: string) => {
    const current = getValues().contactChannels ?? [];
    const updated = [...current.filter((c) => c.type !== type), { type, value }];
    setValue('contactChannels', updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateContactChannel('PHONE', e.target.value);
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateContactChannel('EMAIL', e.target.value);
  };

  return (
    <div>
      <FormProvider {...method}>
        <FormControl className="w-full">
          <FormLabel>Sök på personnummer</FormLabel>
          <SearchField
            size="md"
            className="max-w-[52.5rem]"
            value={personNumber ?? ''}
            {...register('personNumber')}
            onSearch={onSearchHandler}
          ></SearchField>
        </FormControl>

        {searchResult && (
          <div className="border-1 rounded-12 bg-background-content w-max-[52.5rem] my-15">
            <div className="px-16 py-8">
              <span className="text-[1.6rem] font-semibold py-10">
                {firstName} {lastName}
              </span>

              <div className="flex text-md mb-10">
                <div className="flex flex-col">
                  <span className={cx(personNumber ? '' : 'italic text-text-secondary')}>
                    {personNumber || 'Personnummer saknas'}
                  </span>
                  <span className={cx(address && city ? '' : 'italic text-text-secondary')}>
                    {`${address}, ${city}` || 'Adress saknas'}
                  </span>
                </div>
              </div>
              <div className="flex flex-row py-10 gap-10 w-full">
                <FormControl className="w-full">
                  <FormLabel>E-postadress</FormLabel>
                  <Input
                    data-cy="stakeholder-email-input"
                    placeholder="Ange e-postadress"
                    onChange={handleEmailInput}
                  />
                  <FormErrorMessage className="text-error">{}</FormErrorMessage>
                </FormControl>
                <FormControl className="w-full">
                  <FormLabel>Telefonnummer</FormLabel>
                  <Input
                    data-cy="stakeholder-mobilephone-input"
                    placeholder="Ange telefonnummer"
                    onChange={handlePhoneInput}
                  />
                  <FormErrorMessage className="text-error">{}</FormErrorMessage>
                </FormControl>
              </div>

              <FormControl required className="w-[calc(50%-10px)]">
                <FormLabel>Personens roll</FormLabel>
                <Select data-cy="stakeholder-role-select" className="w-full" {...register('role')}>
                  <Select.Option>Välj roll</Select.Option>
                  {/* {roles
                          .sort((a, b) => RoleDisplayNames[a].localeCompare(RoleDisplayNames[b]))
                          .map((role) => (
                            <Select.Option key={role} value={role}>
                              {RoleDisplayNames[role]}
                            </Select.Option>
                          ))} */}
                </Select>
                <FormErrorMessage className="text-error"></FormErrorMessage>
              </FormControl>
              <div className="py-10">
                <Button
                  data-cy="add-stakeholder-button"
                  leftIcon={<LucideIcon name="plus" size={16} />}
                  variant="primary"
                  onClick={handleSubmit(addStakeholderToErrand)}
                  className="w-full lg:w-auto"
                >
                  Lägg till person
                </Button>
              </div>
            </div>
          </div>
        )}
      </FormProvider>

      {stakeholders?.map((stakeholder, index) => {
        return (
          <StakeholderCard
            index={index}
            key={index}
            stakeholder={stakeholder}
            isEditable
            //   availableRoles={roles}
            onRemove={() => remove(index)}
          />
        );
      })}

      <Button
        data-cy="add-manual-person-button"
        variant="primary"
        size="sm"
        color="vattjom"
        inverted={true}
        className="mt-6 w-fit"
        leftIcon={<LucideIcon name="pen" />}
        onClick={() => {
          setManualEntryOpen(true);
        }}
      >
        Lägg till manuellt
      </Button>

      <StakeholderFormModal show={manualEntryOpen} onClose={() => setManualEntryOpen(false)} />
    </div>
  );
};
