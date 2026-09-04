import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import dayjs from 'dayjs';

const TODAY_MAX_DATE = 'today' as const;

type FormUiSchema = UiSchema<Record<string, unknown>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const uiSchemaRecord = (uiSchema: FormUiSchema | undefined): Record<string, unknown> | undefined => {
  const candidate: unknown = uiSchema;
  return isRecord(candidate) ? candidate : undefined;
};

const hasTodayMaximum = (uiSchema: FormUiSchema | undefined): boolean => {
  const options = uiSchemaRecord(uiSchema)?.['ui:options'];
  return isRecord(options) && options.maxDate === TODAY_MAX_DATE;
};

const childUiSchema = (uiSchema: FormUiSchema | undefined, property: string): FormUiSchema | undefined => {
  const child = uiSchemaRecord(uiSchema)?.[property];
  return isRecord(child) ? (child as FormUiSchema) : undefined;
};

/**
 * UI-schemat kan uttrycka en relativ datumgräns utan att versionsbundna JSON-scheman behöver
 * bakas om varje dag. Gränsen materialiseras till `formatMaximum`, så samma schema används av
 * både datumkontrollen, RJSF-valideringen och kontrollen innan formuläret skickas.
 */
export function applyDateBounds(
  schema: RJSFSchema,
  uiSchema: FormUiSchema | undefined,
  today = dayjs().format('YYYY-MM-DD')
): RJSFSchema {
  let boundedSchema = schema;

  if (schema.format === 'date' && hasTodayMaximum(uiSchema)) {
    boundedSchema = { ...boundedSchema, formatMaximum: today };
  }

  const properties = schema.properties as Record<string, RJSFSchema> | undefined;
  if (!properties) return boundedSchema;

  let propertiesChanged = false;
  const boundedProperties = Object.fromEntries(
    Object.entries(properties).map(([property, propertySchema]) => {
      const boundedProperty = applyDateBounds(propertySchema, childUiSchema(uiSchema, property), today);
      propertiesChanged ||= boundedProperty !== propertySchema;
      return [property, boundedProperty];
    })
  );

  return propertiesChanged ? { ...boundedSchema, properties: boundedProperties } : boundedSchema;
}
