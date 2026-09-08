import { getKatlaDefinition } from '@katla/definitions';

export interface CatalogueApplicationPolicy {
  id: string;
  url: string;
  published: boolean;
  allowedGroups: string[];
}

/** Serverägd policy. Samma fil distribueras till katalogen och alla Katla-instanser. */
export interface CataloguePolicy {
  revision: string;
  catalogueUrl: string;
  sessionMaxAgeSeconds: number;
  applications: CatalogueApplicationPolicy[];
}

export const normalizeGroups = (groups: readonly string[]): string[] => [...new Set(groups.map(group => group.trim().toLowerCase()).filter(Boolean))];

const record = (value: unknown, field: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Katalogpolicy: ${field} måste vara ett objekt.`);
  return value as Record<string, unknown>;
};
const nonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim() !== value || !value) throw new Error(`Katalogpolicy: ${field} måste vara en ifylld sträng.`);
  return value;
};
const url = (value: unknown, field: string, production: boolean): string => {
  const input = nonEmptyString(value, field);
  const parsed = new URL(input);
  if (
    !['https:', 'http:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (production && parsed.protocol !== 'https:')
  ) {
    throw new Error(`Katalogpolicy: ${field} måste vara en HTTP(S)-adress utan inloggningsuppgifter, query eller fragment; produktion kräver HTTPS.`);
  }
  return input;
};

export const validateCataloguePolicy = (value: unknown, options: { allowTestDefinitions?: boolean; production?: boolean } = {}): CataloguePolicy => {
  const input = record(value, 'root');
  const revision = nonEmptyString(input.revision, 'revision');
  const catalogueUrl = url(input.catalogueUrl, 'catalogueUrl', options.production === true);
  const sessionMaxAgeSeconds = input.sessionMaxAgeSeconds;
  if (
    !Number.isInteger(sessionMaxAgeSeconds) ||
    typeof sessionMaxAgeSeconds !== 'number' ||
    sessionMaxAgeSeconds < 60 ||
    sessionMaxAgeSeconds > 86400
  ) {
    throw new Error(
      'Katalogpolicy: sessionMaxAgeSeconds måste vara ett heltal mellan 60 och 86400. Gruppändringar får genomslag senast vid denna gräns.',
    );
  }
  if (!Array.isArray(input.applications)) throw new Error('Katalogpolicy: applications måste vara en lista.');
  const ids = new Set<string>();
  const urls = new Set<string>();
  const applications = input.applications.map((entry: unknown, index: number): CatalogueApplicationPolicy => {
    const application = record(entry, `applications[${index}]`);
    const id = nonEmptyString(application.id, `applications[${index}].id`);
    const definition = getKatlaDefinition(id, { allowTestDefinitions: options.allowTestDefinitions });
    if (ids.has(id)) throw new Error(`Katalogpolicy: dubbelt Katla-id ${id}.`);
    ids.add(id);
    const applicationUrl = url(application.url, `${id}.url`, options.production === true);
    const canonicalUrl = new URL(applicationUrl).toString().replace(/\/$/, '');
    if (urls.has(canonicalUrl)) throw new Error(`Katalogpolicy: flera Katlor använder ${applicationUrl}.`);
    urls.add(canonicalUrl);
    if (typeof application.published !== 'boolean') throw new Error(`Katalogpolicy: ${id}.published måste vara true eller false.`);
    if (definition.testOnly && application.published) throw new Error(`Katalogpolicy: testdefinitionen ${id} får aldrig publiceras.`);
    if (
      !Array.isArray(application.allowedGroups) ||
      !application.allowedGroups.every((group: unknown) => typeof group === 'string' && group.trim().length > 0)
    ) {
      throw new Error(`Katalogpolicy: ${id}.allowedGroups måste vara en lista med ifyllda gruppnamn; en tom lista nekar alla.`);
    }
    return { id, url: applicationUrl, published: application.published, allowedGroups: normalizeGroups(application.allowedGroups as string[]) };
  });
  return { revision, catalogueUrl, sessionMaxAgeSeconds, applications };
};

export const canAccessApplication = (policy: CataloguePolicy, id: string, groups: readonly string[]): boolean => {
  const application = policy.applications.find(candidate => candidate.id === id);
  const verifiedGroups = new Set(normalizeGroups(groups));
  return application?.allowedGroups.some(group => verifiedGroups.has(group)) ?? false;
};
