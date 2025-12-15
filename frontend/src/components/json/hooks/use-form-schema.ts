import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useEffect, useState } from 'react';
import { loadFormSchema } from '../utils/schema-utils';

interface UseFormSchemaResult {
  schema: RJSFSchema | null;
  uiSchema: UiSchema | undefined;
  loading: boolean;
  error: string | null;
}

export function useFormSchema(schemaName: string): UseFormSchemaResult {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFormSchema(schemaName)
      .then(({ schema, uiSchema }) => {
        setSchema(schema);
        setUiSchema(uiSchema);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [schemaName]);

  return { schema, uiSchema, loading, error };
}
