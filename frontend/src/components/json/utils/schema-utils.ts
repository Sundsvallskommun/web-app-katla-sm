import type { ErrandFormDataItem } from '@app/[locale]/arende/layout';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validatorAjv8 from '@rjsf/validator-ajv8';
import type { TFunction } from 'i18next';

// Cache för schemas så vi inte hämtar dem flera gånger
const schemaCache = new Map<string, { schema: RJSFSchema; uiSchema?: UiSchema }>();

/**
 * Get human-readable title for an enum value from schema
 */
export function enumTitleOf(schema: RJSFSchema | null, field: string, value: string): string {
  if (!schema || !value) return value ?? '';
  const schemaRecord = schema as Record<string, unknown>;
  const properties = schemaRecord.properties as Record<string, unknown> | undefined;
  const fieldSchema = properties?.[field] as Record<string, unknown> | undefined;
  const oneOf = fieldSchema?.oneOf as Array<{ const: string; title?: string }> | undefined;
  return oneOf?.find((o) => o.const === value)?.title ?? value;
}

/**
 * Get human-readable titles for array of enum values from schema
 */
export function enumTitlesOfArray(schema: RJSFSchema | null, field: string, values: string[] = []): string[] {
  if (!schema) return values ?? [];
  const schemaRecord = schema as Record<string, unknown>;
  const properties = schemaRecord.properties as Record<string, unknown> | undefined;
  const fieldSchema = properties?.[field] as Record<string, unknown> | undefined;
  const items = fieldSchema?.items as Record<string, unknown> | undefined;
  const oneOf = items?.oneOf as Array<{ const: string; title?: string }> | undefined;
  if (!oneOf) return values ?? [];
  return (values ?? []).map((v) => oneOf.find((o) => o.const === v)?.title ?? v);
}

/**
 * Load a form schema from the backend API
 * Results are cached to avoid repeated fetches
 * @param schemaName - Name of the schema to load
 * @param t - Optional translation function for error messages
 */
export async function loadFormSchema(
  schemaName: string,
  t?: TFunction
): Promise<{
  schema: RJSFSchema;
  uiSchema?: UiSchema;
}> {
  // Returnera från cache om vi redan har hämtat schemat
  const cached = schemaCache.get(schemaName);
  if (cached) {
    return cached;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  try {
    // Fetch schema and uiSchema from backend
    const response = await fetch(`${apiUrl}/schemas/${schemaName}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to load schema: ${response.statusText}`);
    }
    const { schema, uiSchema } = (await response.json()) as { schema: RJSFSchema; uiSchema?: UiSchema };

    // Save to cache
    const result = { schema, uiSchema };
    schemaCache.set(schemaName, result);

    return result;
  } catch (error) {
    console.error(`Failed to load schema: ${schemaName}`, error);
    const errorMessage = t ? t('schema_load_error', { schemaName }) : `Could not load schema: ${schemaName}`;
    throw new Error(errorMessage);
  }
}

/**
 * Get list of available form schema names
 * Note: This is a static list. Update this when adding new schemas.
 */
export function getAvailableFormSchemas(): string[] {
  return [
    // 'lex-bedomning',
    'avvikelse-plats-handelse',
    //'test-alla-komponenter',
    // Add more schema names here as they are created
  ];
}

/**
 * Get metadata about a form schema
 */
export function getFormSchemaMetadata(schemaName: string): {
  name: string;
  title: string;
  description: string;
} {
  // This can be extended to read from a metadata file
  const metadata: Record<string, { title: string; description: string }> = {
    'lex-bedomning': {
      title: 'LEX-bedömning',
      description: '',
    },
    'avvikelse-plats-handelse': {
      title: 'Plats och händelseförlopp',
      description: 'Information om var och när avvikelsen inträffade samt händelseförlopp',
    },
    'test-alla-komponenter': {
      title: 'Testformulär - Alla komponenter',
      description: 'Testformulär som visar alla tillgängliga widgets och valideringar',
    },
  };

  return {
    name: schemaName,
    title: metadata[schemaName]?.title ?? schemaName,
    description: metadata[schemaName]?.description ?? '',
  };
}

/**
 * Validate all errand form data against their schemas
 * Returns array of error messages, empty if all valid
 * @param formDataEntries - Array of form data entries to validate
 * @param t - Optional translation function for error messages
 */
export async function validateErrandFormData(
  formDataEntries: ErrandFormDataItem[] | undefined,
  t?: TFunction
): Promise<string[]> {
  if (!formDataEntries || formDataEntries.length === 0) return [];

  const errors: string[] = [];

  for (const entry of formDataEntries) {
    if (!entry.schemaName) continue;

    try {
      const { schema } = await loadFormSchema(entry.schemaName, t);
      const parsedData = entry.data ? JSON.parse(entry.data) : {};
      const { errors: validationErrors } = validatorAjv8.validateFormData(parsedData, schema);

      if (validationErrors.length > 0) {
        const metadata = getFormSchemaMetadata(entry.schemaName);
        errors.push(`${metadata.title}: ${validationErrors[0].message}`);
      }
    } catch {
      const errorMessage =
        t ? t('schema_validation_error', { schemaName: entry.schemaName }) : `Could not validate ${entry.schemaName}`;
      errors.push(errorMessage);
    }
  }

  return errors;
}
