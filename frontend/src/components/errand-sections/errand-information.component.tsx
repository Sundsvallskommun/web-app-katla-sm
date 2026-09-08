'use client';

import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useFormSchema } from '@components/json/hooks/use-form-schema';
import SchemaForm from '@components/json/schema/schema-form.component';
import {
  errandFormDataContractErrorMessage,
  isJsonObject,
  parseErrandFormData,
  schemaFieldPrefix,
  upsertErrandFormDataItem,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { RegistryFieldsType } from '@rjsf/utils';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { FacilitySearchWidget } from 'src/flows/avvikelse/facility-search-widget';
import { getErrandSchemaNames } from 'src/flows/errand-forms';

const avvikelseFields: RegistryFieldsType = { FacilitySearchWidget };

interface SchemaFormFieldProps {
  schemaName: string;
  schemaNames: readonly string[];
  compact?: boolean;
}

function SchemaFormField({ schemaName, schemaNames, compact }: SchemaFormFieldProps) {
  const { getValues, watch, setValue } = useFormContext<ErrandFormDTO>();
  const { showValidation } = useFormValidation();
  const { t } = useTranslation('forms');
  const errandFormData = watch('errandFormData');
  const entry = errandFormData?.find((candidate) => candidate.schemaName === schemaName);
  const { schema, uiSchema, schemaId, loading, error } = useFormSchema(
    schemaName,
    entry === undefined ? { kind: 'new' } : { kind: 'persisted', schemaId: entry.schemaId }
  );
  const status = watch('status');
  const isDraft = status === 'DRAFT';

  const rawData = entry?.data ?? '{}';
  const parsedFormData = parseErrandFormData(rawData, schemaName);
  const formData = parsedFormData.valid && isJsonObject(parsedFormData.value) ? parsedFormData.value : undefined;
  const formDataError =
    !parsedFormData.valid ? errandFormDataContractErrorMessage(parsedFormData.error, t)
    : !formData ? t('unsupported_form_data', { schemaName })
    : undefined;

  const handleChange = useCallback(
    (data: Record<string, unknown>) => {
      if (!schemaId) {
        throw new Error(`Cannot update ${schemaName} without a schema ID`);
      }
      setValue(
        'errandFormData',
        upsertErrandFormDataItem(getValues('errandFormData'), {
          schemaName,
          schemaId,
          data: JSON.stringify(data),
        })
      );
    },
    [getValues, schemaId, schemaName, setValue]
  );

  if (formDataError) {
    return (
      <Text role="alert" className="text-danger">
        {formDataError}
      </Text>
    );
  }

  if (loading) {
    return <Text color="secondary">{t('errand-information:deviation_information.loading_form')}</Text>;
  }

  if (error || !schema || !schemaId) {
    return (
      <Text role="alert" className="text-danger">
        {t('schema_load_error', { schemaName })}
      </Text>
    );
  }

  return (
    <SchemaForm
      fields={appConfig.katla?.flow === 'avvikelse' ? avvikelseFields : undefined}
      idPrefix={schemaFieldPrefix(schemaName, schemaNames)}
      schemaId={schemaId}
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onChange={handleChange}
      hideSubmitButton
      showValidation={showValidation}
      disabled={!isDraft}
      compact={compact}
    />
  );
}

interface ErrandInformationProps {
  compact?: boolean;
}

export const ErrandInformation: React.FC<ErrandInformationProps> = ({ compact }) => {
  const { watch } = useFormContext<ErrandFormDTO>();
  const entries = watch('errandFormData');
  const id = watch('id');
  const schemaNames = appConfig.katla ? getErrandSchemaNames({ id, errandFormData: entries }, appConfig.katla) : [];
  return (
    <Stack gap={6}>
      {schemaNames.map((schemaName) => (
        <SchemaFormField key={schemaName} schemaName={schemaName} schemaNames={schemaNames} compact={compact} />
      ))}
    </Stack>
  );
};
