import avvikelsePlatsHandelseSchema from '@/local-schemas/avvikelse-plats-handelse.schema.json';
import avvikelsePlatsHandelseUiSchema from '@/local-schemas/avvikelse-plats-handelse.ui-schema.json';

/**
 * Tillfällig lokal kopia av scheman som annars hämtas från jsonschema-API:t.
 *
 * Rubrikerna i avvikelseformuläret justeras just nu i repot i stället för via API:t, så att
 * ändringar går att granska i en pull request och rullas tillbaka med koden. Kopiorna har
 * exakt samma form som API-svaren ({ id, value }) och går genom samma mappning och
 * x-i18n-upplösning som de riktiga svaren — texten lokaliseras alltså precis som förut.
 *
 * För att gå tillbaka till API:t: töm listan nedan (eller ta bort filen och anropen i
 * SchemaController). Inget annat behöver ändras.
 */
const LOCAL_SCHEMAS = [{ schema: avvikelsePlatsHandelseSchema, uiSchema: avvikelsePlatsHandelseUiSchema }] as const;

export interface LocalSchemaOverride {
  /** Rått schemasvar, matar mapSchemaResponse. */
  schema: Record<string, unknown>;
  /** Rått ui-schemasvar med x-i18n kvar, matar mapUiSchema och localizeUiSchema. */
  uiSchema: Record<string, unknown>;
}

const toOverride = (entry: (typeof LOCAL_SCHEMAS)[number]): LocalSchemaOverride => ({
  schema: entry.schema,
  uiSchema: entry.uiSchema,
});

/** Senaste versionen av ett namngivet schema. Undefined när schemat inte hålls lokalt. */
export const findLocalSchemaByName = (schemaName: string): LocalSchemaOverride | undefined => {
  const entry = LOCAL_SCHEMAS.find(candidate => candidate.schema.name === schemaName);
  return entry ? toOverride(entry) : undefined;
};

/**
 * Ärenden pinnas till sitt schema-ID, så uppslaget måste fungera på ID också. Ett ärende som
 * sparats mot en annan version faller igenom till API:t och renderas med det schema det skapades med.
 */
export const findLocalSchemaById = (schemaId: string): LocalSchemaOverride | undefined => {
  const entry = LOCAL_SCHEMAS.find(candidate => candidate.schema.id === schemaId);
  return entry ? toOverride(entry) : undefined;
};
