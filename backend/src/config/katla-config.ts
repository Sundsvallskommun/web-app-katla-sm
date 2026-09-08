import { readFileSync } from 'node:fs';

import { getKatlaDefinition, KatlaDefinition } from '@katla/definitions';
import { definitionRevision } from '@katla/definitions/server';

import { CataloguePolicy, validateCataloguePolicy } from './catalogue-policy';

type Environment = Readonly<Record<string, string | undefined>>;
interface SharedRuntimeConfiguration {
  catalogueFile: string;
  allowTestDefinitions: boolean;
  production: boolean;
  sessionInstanceId: string;
  sessionCookieName: string;
  sessionCookiePath: string;
}
export type RuntimeConfiguration = SharedRuntimeConfiguration &
  ({ mode: 'catalogue' } | { mode: 'katla'; katlaId: string; definition: KatlaDefinition; definitionRevision: string });

const required = (environment: Environment, field: string): string => {
  const value = environment[field];
  if (!value?.trim() || value.trim() !== value || /^(?:<.*>|\{\{.*\}\})$/.test(value))
    throw new Error(`${field}: ange ett giltigt värde i instansens serverkonfiguration.`);
  return value;
};

/** Namespace, municipality and upstream credentials belong to the recipient connection. */
const validateRecipientConfiguration = (environment: Environment): void => {
  for (const field of ['API_BASE_URL', 'CLIENT_KEY', 'CLIENT_SECRET', 'MUNICIPALITY_ID', 'NAMESPACE']) required(environment, field);
  let apiBaseUrl: URL;
  try {
    apiBaseUrl = new URL(environment.API_BASE_URL ?? '');
  } catch {
    throw new Error('API_BASE_URL: ange en fullständig HTTP(S)-adress.');
  }
  if (!['https:', 'http:'].includes(apiBaseUrl.protocol) || apiBaseUrl.username || apiBaseUrl.password || apiBaseUrl.search || apiBaseUrl.hash) {
    throw new Error('API_BASE_URL: använd en HTTP(S)-adress utan inloggningsuppgifter, query eller fragment.');
  }

  if (!/^\d{4}$/.test(environment.MUNICIPALITY_ID ?? '')) throw new Error('MUNICIPALITY_ID: ange en fyrsiffrig kommunkod.');
  if (!/^[A-Za-z0-9_-]+$/.test(environment.NAMESPACE ?? '')) throw new Error('NAMESPACE: ange ett namespace utan sökvägsseparatorer.');
};

/** Validerar startkonfiguration utan nätverksanrop eller utdata av hemliga värden. */
export const loadRuntimeConfiguration = (environment: Environment = process.env): RuntimeConfiguration => {
  const mode = environment.APP_MODE;
  if (mode !== 'katla' && mode !== 'catalogue') throw new Error('APP_MODE: välj katla eller catalogue.');
  const production = environment.NODE_ENV === 'production' && environment.ENVIRONMENT !== 'LOCAL';
  const allowTestDefinitions = environment.ALLOW_TEST_KATLA === 'true';
  if (allowTestDefinitions && production) throw new Error('ALLOW_TEST_KATLA: testdefinitioner är inte tillåtna i produktion.');
  if (environment.AUTHORIZED_GROUPS !== undefined)
    throw new Error('AUTHORIZED_GROUPS är ersatt av KATLA_CATALOGUE_FILE. Ta bort parallella åtkomstregler.');
  const catalogueFile = required(environment, 'KATLA_CATALOGUE_FILE');
  const sessionCookieName = required(environment, 'SESSION_COOKIE_NAME');
  const sessionCookiePath = required(environment, 'SESSION_COOKIE_PATH');
  if (!/^[A-Za-z0-9._-]+$/.test(sessionCookieName))
    throw new Error('SESSION_COOKIE_NAME: använd bokstäver, siffror, punkt, bindestreck eller understreck.');
  if (!sessionCookiePath.startsWith('/') || /[;?\s#]/.test(sessionCookiePath))
    throw new Error('SESSION_COOKIE_PATH: ange appens absoluta monteringsrot.');
  const katlaId = mode === 'katla' ? required(environment, 'KATLA_ID') : undefined;
  if (mode === 'catalogue' && environment.KATLA_ID) throw new Error('KATLA_ID ska utelämnas i katalogläge.');
  const expectedCookieName = `katla.${katlaId ?? 'catalogue'}.sid`;
  if (sessionCookieName !== expectedCookieName) throw new Error(`SESSION_COOKIE_NAME: använd ${expectedCookieName} för att isolera denna instans.`);
  const shared: SharedRuntimeConfiguration = {
    catalogueFile,
    allowTestDefinitions,
    production,
    sessionInstanceId: `${mode}:${katlaId ?? 'catalogue'}:${sessionCookieName}:${sessionCookiePath}`,
    sessionCookieName,
    sessionCookiePath,
  };
  if (mode === 'catalogue') return { ...shared, mode };
  if (!katlaId) throw new Error('KATLA_ID saknas.');
  validateRecipientConfiguration(environment);
  const definition = getKatlaDefinition(katlaId, { allowTestDefinitions });
  return { ...shared, mode, katlaId, definition, definitionRevision: definitionRevision(definition) };
};

/** Läs aktuell policy per anrop: en atomisk filersättning kan omedelbart dra in appåtkomst. */
export const readCataloguePolicy = (configuration: RuntimeConfiguration): CataloguePolicy => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configuration.catalogueFile, 'utf8')) as unknown;
  } catch {
    throw new Error('KATLA_CATALOGUE_FILE: kan inte läsa giltig JSON. Återställ föregående verifierade policyfil.');
  }
  const policy = validateCataloguePolicy(raw, configuration);
  if (configuration.mode === 'katla' && !policy.applications.some(application => application.id === configuration.katlaId)) {
    throw new Error(`Katalogpolicy: ${configuration.katlaId} saknas. Registrera instansen i den gemensamma serverpolicyn.`);
  }
  return policy;
};
