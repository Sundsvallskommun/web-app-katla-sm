/**
 * Möjlighet att hålla ett schema lokalt i repot i stället för att hämta det från jsonschema-API:t.
 *
 * Listan är tom: avvikelseformulärets schema ligger i API:t igen, och appen läser därifrån.
 * Filerna under `src/local-schemas/` är kvar som referens och för att snabbt kunna gå tillbaka.
 *
 * För att hålla ett schema lokalt igen: importera filerna och lägg in dem i listan nedan —
 * kopiorna har exakt samma form som API-svaren ({ id, value }) och går genom samma mappning och
 * x-i18n-upplösning, så texten lokaliseras precis som förut. Inget annat behöver ändras.
 *
 *   import schema from '@/local-schemas/avvikelse-plats-handelse.schema.json';
 *   import uiSchema from '@/local-schemas/avvikelse-plats-handelse.ui-schema.json';
 *   const LOCAL_SCHEMAS: LocalSchemaOverride[] = [{ schema, uiSchema }];
 */

export interface LocalSchemaOverride {
  /** Rått schemasvar, matar mapSchemaResponse. */
  schema: Record<string, unknown>;
  /** Rått ui-schemasvar med x-i18n kvar, matar mapUiSchema och localizeUiSchema. */
  uiSchema: Record<string, unknown>;
}

const LOCAL_SCHEMAS: LocalSchemaOverride[] = [];

/** Senaste versionen av ett namngivet schema. Undefined när schemat inte hålls lokalt. */
export const findLocalSchemaByName = (schemaName: string): LocalSchemaOverride | undefined =>
  LOCAL_SCHEMAS.find(candidate => candidate.schema.name === schemaName);

/**
 * Ärenden pinnas till sitt schema-ID, så uppslaget måste fungera på ID också. Ett ärende som
 * sparats mot en annan version faller igenom till API:t och renderas med det schema det skapades med.
 */
export const findLocalSchemaById = (schemaId: string): LocalSchemaOverride | undefined =>
  LOCAL_SCHEMAS.find(candidate => candidate.schema.id === schemaId);
