'use client';

import { useFormSchema } from '@components/json/hooks/use-form-schema';
import SchemaForm from '@components/json/schema/schema-form.component';
import { getSchemasForCaseType } from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@app/[locale]/arende/layout';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

interface SchemaFormFieldProps {
  schemaName: string;
  index: number;
}

function SchemaFormField({ schemaName, index }: SchemaFormFieldProps) {
  const { watch, setValue } = useFormContext<ErrandFormDTO>();
  const { showValidation } = useFormValidation();
  const { schema, uiSchema, loading, error } = useFormSchema(schemaName);

  const rawData = watch(`errandFormData.${index}.data`) ?? '{}';
  const formData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

  const handleChange = useCallback(
    (data: Record<string, unknown>) => {
      setValue(`errandFormData.${index}`, { schemaName, data: JSON.stringify(data) });
    },
    [setValue, index, schemaName]
  );

  if (loading) {
    return <div className="text-gray-500">Laddar formulär...</div>;
  }

  if (error || !schema) {
    return <div className="text-error">Fel: {error ?? 'Kunde inte ladda schema'}</div>;
  }

  return (
    <SchemaForm
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onChange={handleChange}
      hideSubmitButton
      showValidation={showValidation}
    />
  );
}

export const DeviationInformation: React.FC = () => {
  const { watch } = useFormContext<ErrandFormDTO>();
  const caseType = watch('classification.type');
  const schemas = getSchemasForCaseType(caseType ?? '');

  if (schemas.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-24">
      {schemas.map((schemaName, index) => (
        <SchemaFormField key={schemaName} schemaName={schemaName} index={index} />
      ))}
    </div>
  );
};
