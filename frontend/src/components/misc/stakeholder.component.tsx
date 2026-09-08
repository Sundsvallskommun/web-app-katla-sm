import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { List } from '@astryxdesign/core/List';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { yupResolver } from '@hookform/resolvers/yup';
import { getStakeholderUsingPersonNumber } from '@services/citizen/citizen-service';
import { getEmployeeByPersonNumber, getEmployeeStakeholderFromApi } from '@services/employee-service/employee-service';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import {
  createStakeholderSchema,
  emptyStakeholder,
  phoneNumberFormatter,
  shouldShowContactDetails,
} from '@utils/stakeholder';
import clsx from 'clsx';
import { Pen, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, Resolver, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

import { StakeholderFormModal } from './stakeholder-modal.component';
import { StakeholderRow } from './stakeholder-row.component';

export const StakeholderList: React.FC<{
  roles: string[];
  employeeSearch?: boolean;
  autoDetectSearch?: boolean;
  maxCount?: number;
  hideRoleSelect?: boolean;
  /** Dölj roll som redan framgår av avsnittets rubrik. */
  hideRole?: boolean;
  /**
   * Listans id i valideringen. Med det visar listan sitt eget fel och märker ut sig, så att
   * felsammanfattningen kan länka hit — samma sätt som fälten i schemaformuläret.
   */
  fieldId?: string;
}> = ({
  roles,
  employeeSearch = false,
  autoDetectSearch = false,
  maxCount,
  hideRoleSelect = false,
  hideRole = false,
  fieldId,
}) => {
  const [searchMode, setSearchMode] = useState<string>('PERSON');
  const [query, setQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<boolean>(false);
  const [emptyResult, setEmptyResult] = useState<boolean>(false);
  const [manualEntryOpen, setManualEntryOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();
  const { t } = useTranslation();
  const { errors } = useFormValidation();
  const fieldError = fieldId ? errors.find((error) => error.fieldId === fieldId) : undefined;
  const isLocked = useIsContentLocked();

  const context = useFormContext<ErrandDTO>();
  const { stakeholders } = context.watch();

  const { append, remove } = useFieldArray({
    control: context.control,
    name: 'stakeholders',
  });

  // Byggs om när språket ändras – yup fryser felmeddelandena vid konstruktionen.
  const stakeholderSchema = useMemo(() => createStakeholderSchema(t), [t]);

  const method = useForm<StakeholderDTO>({
    defaultValues: emptyStakeholder,
    mode: 'onSubmit',
    resolver: yupResolver(stakeholderSchema) as unknown as Resolver<StakeholderDTO>,
  });

  const { handleSubmit, control, watch, reset, trigger, setValue, clearErrors, formState } = method;
  const { firstName, lastName, personNumber, address, city, title, department } = watch();

  //Used for resetting form when adding multiple stakeholders
  useEffect(() => {
    reset();
  }, [formState.isSubmitSuccessful]);

  const hasPrimaryStakeholder = stakeholders?.some((s) => s.role?.includes('PRIMARY'));
  const hasPrimaryRole = roles.includes('PRIMARY');
  const matchingCount = stakeholders?.filter((s) => roles.includes(s.role ?? '')).length ?? 0;
  const maxCountReached = maxCount !== undefined && matchingCount >= maxCount;
  // Sök- och lägg till-kontrollerna hör till redigering. På ett inlåst ärende
  // gjorde fieldsetet dem bara oklickbara, så ett personsökfält och en
  // Lägg till manuellt-knapp stod kvar utan att svara på något.
  const showAddButton =
    !isLocked && !maxCountReached && (!hasPrimaryRole || (hasPrimaryRole && !hasPrimaryStakeholder));

  const clearStakeholderForm = () => {
    setQuery('');
    setSearchResult(false);
    setEmptyResult(false);
    reset(emptyStakeholder);
  };

  const onSearchHandler = async (query: string) => {
    const effectiveMode =
      autoDetectSearch ?
        /^\d{8}-?\d{4}$/.test(query) ?
          'PERSON'
        : 'EMPLOYEE'
      : searchMode;

    if (effectiveMode === 'PERSON') {
      setValue('personNumber', query);
      const isValid = await trigger('personNumber');
      if (!isValid) {
        return;
      }
      const searchFn = autoDetectSearch ? getEmployeeByPersonNumber : getStakeholderUsingPersonNumber;
      searchFn(query)
        .then((res) => {
          if (res.status === 200) {
            reset(res.data);
            setEmptyResult(false);
            setSearchResult(true);
          } else {
            setEmptyResult(true);
          }
        })
        .catch(() => {
          setEmptyResult(true);
        });
    }
    if (effectiveMode === 'EMPLOYEE') {
      getEmployeeStakeholderFromApi(query)
        .then((res) => {
          if (res.status === 200) {
            reset(res.data);
            setEmptyResult(false);
            setSearchResult(true);
          } else {
            setEmptyResult(true);
          }
        })
        .catch(() => {
          setEmptyResult(true);
        });
    }
  };

  const addStakeholderToErrand = (stakeholder: StakeholderDTO) => {
    if (hideRoleSelect && metadata) {
      stakeholder.role = roles[0];
    }
    append({ ...stakeholder, phoneNumbers: [phoneNumberFormatter(stakeholder?.phoneNumbers?.[0])] });
    clearStakeholderForm();
  };

  const roleOptions =
    metadata?.roles
      ?.filter((role) => roles.includes(role.name))
      .map((role) => ({ value: role.name, label: role.displayName })) ?? [];
  const searchError =
    formState.errors.personNumber?.message ??
    (emptyResult ? t('errand-information:stakeholder.no_person_found') : undefined);

  return (
    <div className="flex min-w-0 flex-col gap-4" {...(fieldError ? { [INVALID_FIELD_ATTRIBUTE]: fieldId } : {})}>
      {fieldError && (
        <div data-cy={`${fieldId ?? 'stakeholder'}-error`}>
          <FieldStatus type="error" message={fieldError.message} variant="detached" />
        </div>
      )}
      <FormProvider {...method}>
        {showAddButton && (
          <div className="flex flex-col gap-4">
            {employeeSearch && !autoDetectSearch && (
              <RadioList
                label={t('errand-information:stakeholder.search_mode')}
                value={searchMode}
                orientation="horizontal"
                onChange={(value) => {
                  setSearchMode(value);
                  clearStakeholderForm();
                }}
              >
                <RadioListItem
                  data-cy="radiobutton-person"
                  label={t('errand-information:stakeholder.person')}
                  value="PERSON"
                />
                <RadioListItem
                  data-cy="radiobutton-employee"
                  label={t('errand-information:stakeholder.employee')}
                  value="EMPLOYEE"
                />
              </RadioList>
            )}
            <div className="flex max-w-2xl flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextInput
                  data-cy="person-number-input"
                  label={t(`errand-information:search.${autoDetectSearch ? 'AUTODETECT' : searchMode}`)}
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setEmptyResult(false);
                    clearErrors('personNumber');
                  }}
                  onEnter={() => {
                    if (!searchResult) void onSearchHandler(query);
                  }}
                  isReadOnly={searchResult}
                  width="100%"
                  status={searchError ? { type: 'error', message: searchError } : undefined}
                  statusVariant="detached"
                />
              </div>
              <div className="flex gap-2 self-start pt-6">
                <Button
                  label={searchResult ? t('errand-information:stakeholder.clear_search') : t('filtering:search')}
                  icon={searchResult ? <X size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                  variant="secondary"
                  onClick={() => {
                    if (searchResult) clearStakeholderForm();
                    else void onSearchHandler(query);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {searchResult && (
          <Card data-cy="search-result" padding={5}>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="break-words">
                <p className="font-semibold">
                  {firstName} {lastName}
                </p>
                <div className="mt-1 text-sm text-muted">
                  {title ?
                    <p>{title}</p>
                  : <p className={clsx(!personNumber && 'italic')}>
                      {(personNumber ?? '') || t('errand-information:stakeholder.missing_person_number')}
                    </p>
                  }
                  {department ?
                    <p>{department}</p>
                  : <p className={clsx((!address || !city) && 'italic')}>
                      {address && city ? `${address}, ${city}` : t('errand-information:stakeholder.missing_address')}
                    </p>
                  }
                </div>
              </div>
              {shouldShowContactDetails(roles) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="emails.0"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        htmlName={field.name}
                        data-cy="stakeholder-email-input"
                        label={t('errand-information:stakeholder.email')}
                        value={field.value ?? ''}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                        placeholder={t('errand-information:stakeholder.email_placeholder')}
                        isOptional
                        width="100%"
                        status={fieldState.error ? { type: 'error', message: fieldState.error.message } : undefined}
                        statusVariant="detached"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="phoneNumbers.0"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        htmlName={field.name}
                        data-cy="stakeholder-mobilephone-input"
                        label={t('errand-information:stakeholder.phone')}
                        value={field.value ?? ''}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                        placeholder={t('errand-information:stakeholder.phone_placeholder')}
                        isOptional
                        width="100%"
                        status={fieldState.error ? { type: 'error', message: fieldState.error.message } : undefined}
                        statusVariant="detached"
                      />
                    )}
                  />
                </div>
              )}
              {!hideRoleSelect && (
                <Controller
                  control={control}
                  name="role"
                  defaultValue={roleOptions[0]?.value ?? ''}
                  render={({ field, fieldState }) => (
                    <Selector
                      data-cy="stakeholder-role-select"
                      label={t('errand-information:stakeholder.person_role')}
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
              )}
              <div>
                <Button
                  data-cy="add-stakeholder-button"
                  label={t('errand-information:stakeholder.add_person')}
                  icon={<Plus size={16} aria-hidden="true" />}
                  variant="primary"
                  onClick={(event) => {
                    void handleSubmit(addStakeholderToErrand)(event);
                  }}
                />
              </div>
            </div>
          </Card>
        )}
      </FormProvider>

      {matchingCount > 0 && (
        <List hasDividers className="rounded-lg border border-default bg-subtle">
          {stakeholders?.map((stakeholder, index) => {
            if (!roles.includes(stakeholder.role ?? '')) return null;
            return (
              <StakeholderRow
                key={index}
                stakeholder={stakeholder}
                hideRole={hideRole}
                roles={roles}
                onRemove={() => {
                  remove(index);
                }}
              />
            );
          })}
        </List>
      )}

      {showAddButton && (
        <div>
          <Button
            data-cy="add-manual-person-button"
            label={t('errand-information:stakeholder.add_manually')}
            variant="secondary"
            icon={<Pen size={16} aria-hidden="true" />}
            onClick={() => {
              setManualEntryOpen(true);
            }}
          />
        </div>
      )}

      <StakeholderFormModal
        roles={roles}
        show={manualEntryOpen}
        onClose={() => {
          setManualEntryOpen(false);
        }}
        editableFields={
          !hideRoleSelect && (roles.includes('EMPLOYEE') || roles.includes('SUBSTITUTEASSIGNMENT')) ?
            ['personNumber', 'firstName', 'lastName', 'emails', 'phoneNumbers', 'role']
          : ['personNumber', 'firstName', 'lastName', 'emails', 'phoneNumbers']
        }
      />
    </div>
  );
};
