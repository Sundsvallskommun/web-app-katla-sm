import { StatusDTO } from '@data-contracts/backend/data-contracts';

/** Den enda status som räknas som avslutad, och därmed den enda som hålls utanför Inskickade. */
export const SOLVED_STATUS = 'SOLVED';

/** Utkast är rapportörens egna osända rapporter och har en egen lista när funktionen är påslagen. */
export const DRAFT_STATUS = 'DRAFT';

/** API:ernas texter är skrivna på svenska. Se kommentaren i i18nConfig. */
export const METADATA_LANGUAGE = 'sv';

interface StatusDisplayNameOptions {
  /** Vår egen text för statusen i det språk som visas, om vi har någon. */
  translation?: string;
  /** Sant när det visade språket inte är metadatans, och vår översättning därför går först. */
  preferTranslation?: boolean;
}

/**
 * Visningsnamnet kommer från metadatan i stället för en lista i koden. externalDisplayName är det
 * namn som är skrivet för den som rapporterat — handläggarens egna namn på statusen står i
 * displayName.
 *
 * Metadatan finns bara på svenska. På svenska är den därför facit, och på andra språk går vår egen
 * översättning först. De täcker upp för varandra åt båda håll: en status vi inte översatt visas med
 * sitt svenska namn hellre än med statuskoden, och en status metadatan inte känner till visas med
 * vår text. Statuskoden är sista utvägen, eftersom den är begriplig på ett sätt en tom etikett inte är.
 */
export const getStatusDisplayName = (
  status: string | undefined,
  statuses: StatusDTO[] | undefined,
  { translation, preferTranslation = false }: StatusDisplayNameOptions = {}
): string => {
  if (!status) return '';

  const metadataStatus = statuses?.find((candidate) => candidate.name === status);
  const metadataName = metadataStatus?.externalDisplayName ?? metadataStatus?.displayName ?? undefined;
  const candidates = preferTranslation ? [translation, metadataName] : [metadataName, translation];

  return candidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '') ?? status;
};

/**
 * Alla statusar utom de avslutade. Listan hämtas ur metadatan eftersom handläggarens statusflöde
 * ändras i namespacet: en rapport som fått en ny status ska inte försvinna ur rapportörens
 * översikt bara för att appen inte känner till statusen.
 *
 * Tom lista betyder att metadatan inte hunnit hämtas — inte att inga statusar är öppna. Anropare
 * måste vänta i stället för att fråga utan filter, som skulle ta med de avslutade.
 */
export const getOpenStatuses = (statuses: StatusDTO[] | undefined, excludeDraft: boolean): string[] =>
  (statuses ?? [])
    .filter((status) => status.deprecated !== true)
    .map((status) => status.name)
    .filter((name) => name !== SOLVED_STATUS && !(excludeDraft && name === DRAFT_STATUS));
