import { loadFormSchema, requireSchemaId } from '@components/json/utils/schema-utils';
import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import { KatlaDefinition } from '@katla/definitions';
import { TFunction } from 'i18next';

/** Saved form membership wins over later definition changes. Empty legacy drafts have no schema identity to preserve. */
export function getErrandSchemaNames(
  values: Pick<ErrandFormDTO, 'id' | 'errandFormData'>,
  definition: KatlaDefinition
): string[] {
  return values.id && values.errandFormData?.length ?
      values.errandFormData.map((entry) => entry.schemaName)
    : definition.forms.map((form) => form.schemaName);
}

/** Lock every form on first save, including forms the mobile user has not visited yet. */
export async function initializeErrandFormData(
  values: ErrandFormDTO,
  definition: KatlaDefinition,
  t: TFunction,
  locale: string
): Promise<ErrandFormDataItem[]> {
  const entries = values.errandFormData ?? [];
  const missing = getErrandSchemaNames(values, definition).filter(
    (name) => !entries.some((entry) => entry.schemaName === name)
  );
  for (const entry of entries) requireSchemaId(entry.schemaId, entry.schemaName);
  const initialized = await Promise.all(
    missing.map(async (schemaName) => {
      const { schemaId } = await loadFormSchema(schemaName, t, locale);
      return { schemaName, schemaId, data: '{}' };
    })
  );
  return [...entries, ...initialized];
}
