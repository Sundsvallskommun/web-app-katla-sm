import Ajv from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type AjvCore from 'ajv/dist/core';
import { DomUtils, parseDocument } from 'htmlparser2';

/** Samma HTML/entity-tolkning i browser och server, även utan DOMParser. */
export const stripHtml = (html: string): string => DomUtils.textContent(parseDocument(html)).trim();

/** Bevarar formulärets etablerade regel: min/maxLength räknar text utan HTML-uppmärkning. */
export const installHtmlLengthKeywords = (ajv: AjvCore): void => {
  const keywords = [
    { name: 'minLength', valid: (length: number, limit: number) => length >= limit },
    { name: 'maxLength', valid: (length: number, limit: number) => length <= limit },
  ];
  for (const keyword of keywords) {
    ajv.removeKeyword(keyword.name);
    ajv.addKeyword({
      keyword: keyword.name,
      type: 'string',
      schemaType: 'number',
      validate: (limit: number, value: string) => keyword.valid(stripHtml(value).length, limit),
    });
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Datumregler avser den svenska verksamhetens kalenderdag, oberoende av serverns tidszon. */
export const todayInSweden = (): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date());

/** Materialiserar UI-schemats etablerade maxDate=today utan att ändra schema eller lagrade värden. */
export function applyDateBounds<Schema extends object>(
  schema: Schema,
  uiSchema: object | undefined,
  today = todayInSweden(),
): Schema {
  const input = schema as Record<string, unknown>;
  const ui = uiSchema as Record<string, unknown> | undefined;
  const options = ui?.['ui:options'];
  let result = input;
  if (input.format === 'date' && isRecord(options) && options.maxDate === 'today')
    result = { ...result, formatMaximum: today };
  if (isRecord(input.properties)) {
    let changed = false;
    const properties = Object.fromEntries(
      Object.entries(input.properties).map(([key, value]) => {
        if (!isRecord(value)) return [key, value];
        const childUi = ui?.[key];
        const bounded = applyDateBounds(value, isRecord(childUi) ? childUi : undefined, today);
        changed ||= bounded !== value;
        return [key, bounded];
      }),
    );
    if (changed) result = { ...result, properties };
  }
  return result as Schema;
}
/** All consumers use the same supported dialects; absent $schema follows the existing form engine. */
export function schemaAjvClass(dialect: unknown) {
  if (dialect === undefined || dialect === 'https://json-schema.org/draft/2020-12/schema') return Ajv2020;
  if (dialect === 'https://json-schema.org/draft/2019-09/schema') return Ajv2019;
  if (dialect === 'http://json-schema.org/draft-07/schema#' || dialect === 'https://json-schema.org/draft-07/schema')
    return Ajv;
  throw new Error('SCHEMA_DIALECT_UNSUPPORTED');
}

export function createSchemaAjv(dialect: unknown): AjvCore {
  const Constructor = schemaAjvClass(dialect);
  const ajv = new Constructor({
    allErrors: true,
    strict: false,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
  });
  addFormats(ajv, { keywords: true });
  installHtmlLengthKeywords(ajv);
  return ajv;
}
