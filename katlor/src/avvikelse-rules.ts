/** Strukturellt kontrakt som uppfylls av metadata-DTO:erna i frontend och backend. */
export interface Label {
  id?: string;
  classification: string;
  displayName?: string;
  resourcePath?: string;
  resourceName: string;
  labels?: Label[];
}

/**
 * Labelstrukturen används för rättighetsstyrning i Support Management. Platsvalet måste därför peka
 * ut en nod som faktiskt finns i strukturen — både sökningen och ärendets labels byggs från det här
 * trädet istället för från organisationsträdet i company-API:t.
 */
const PLACE_STRUCTURE_ROOT_NAMES = new Set(['platsstruktur', 'place_structure', 'placestructure']);
const PLACE_STRUCTURE_ROOT_LEVEL = 2;
const PLACE_LEVEL = 6;
const DEPARTMENT_LEVEL = 7;

export interface PlaceNode {
  /** Labelnoden själv */
  label: Label;
  /** Kedjan från platsstrukturens rot ner till och med noden */
  path: Label[];
}

export interface PlaceSelectionPresentation {
  place: string;
  department?: string;
}

export const normalizeLabelName = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const labelName = (label: Label): string => label.displayName ?? label.resourceName;

/** Identitet i första hand på id och resourcePath, som är unika i hela strukturen */
export const isSameLabel = (a: Label | undefined, b: Label | undefined): boolean => {
  if (!a || !b) return false;
  if (a.id && b.id) return a.id === b.id;
  if (a.resourcePath && b.resourcePath) return a.resourcePath === b.resourcePath;
  return normalizeLabelName(a.resourceName) === normalizeLabelName(b.resourceName);
};

export const getPlaceStructureRoot = (labelStructure: Label[] | undefined): Label | undefined =>
  labelStructure?.find(
    (label) =>
      PLACE_STRUCTURE_ROOT_NAMES.has(normalizeLabelName(label.resourceName)) ||
      PLACE_STRUCTURE_ROOT_NAMES.has(normalizeLabelName(label.displayName)),
  );

/** Alla noder under platsstrukturens rot, var och en med sin väg från roten */
export const flattenPlaceNodes = (root: Label | undefined): PlaceNode[] => {
  if (!root) return [];

  const nodes: PlaceNode[] = [];
  const traverse = (label: Label, ancestors: Label[]) => {
    const path = [...ancestors, label];
    nodes.push({ label, path });
    label.labels?.forEach((child) => {
      traverse(child, path);
    });
  };

  root.labels?.forEach((child) => {
    traverse(child, [root]);
  });

  return nodes;
};

export const getPlaceNodes = (labelStructure: Label[] | undefined): PlaceNode[] =>
  flattenPlaceNodes(getPlaceStructureRoot(labelStructure));

export const hasSubPlaces = (node: PlaceNode): boolean => (node.label.labels?.length ?? 0) > 0;

export const placeName = (node: PlaceNode): string => labelName(node.label);

/** Föräldern inom platsstrukturen. Roten räknas inte som förälder. */
export const placeParentName = (node: PlaceNode): string | undefined => {
  const parent = node.path.at(-2);
  return parent && !isSameLabel(parent, node.path[0]) ? labelName(parent) : undefined;
};

/**
 * Namn kvalificerat med föräldern. Sista nivån är inte unik i sig — "Blå" finns under flera
 * enheter — så "VOF ÄB Skottsundsbacken geme. Blå" är det som identifierar platsen för en läsare.
 */
export const qualifiedPlaceName = (node: PlaceNode): string => {
  const parentName = placeParentName(node);
  return parentName ? `${parentName} ${placeName(node)}` : placeName(node);
};

const labelAtLevel = (node: PlaceNode, level: number): Label | undefined =>
  node.path[level - PLACE_STRUCTURE_ROOT_LEVEL];

/**
 * Nivå 6 är platsen som visas. Nivå 7 är en valfri avdelning under platsen.
 * För ett ännu ofullständigt val på nivå 3–5 visas den aktuella noden tills användaren valt vidare.
 */
export const getPlaceSelectionPresentation = (node: PlaceNode): PlaceSelectionPresentation => {
  const place = labelAtLevel(node, PLACE_LEVEL) ?? node.label;
  const department = labelAtLevel(node, DEPARTMENT_LEVEL);

  return {
    place: labelName(place),
    ...(department ? { department: labelName(department) } : {}),
  };
};

/** Sökindexet innehåller samtliga användarnivåer 3–7 men inte den tekniska roten på nivå 2. */
export const placeSearchText = (node: PlaceNode): string =>
  node.path
    .slice(1, DEPARTMENT_LEVEL - PLACE_STRUCTURE_ROOT_LEVEL + 1)
    .map(labelName)
    .join(' ');

/** Sökord får ligga på olika nivåer i strukturen och behöver därför inte stå direkt efter varandra. */
export const matchesPlaceSearch = (node: PlaceNode, query: string): boolean => {
  const searchableText = normalizeLabelName(placeSearchText(node));
  const terms = normalizeLabelName(query).split(' ').filter(Boolean);
  return terms.every((term) => searchableText.includes(term));
};

export const placeKey = (node: PlaceNode): string => node.label.resourcePath ?? node.path.map(labelName).join('/');

export const findPlaceNodeByKey = (nodes: PlaceNode[], key: string): PlaceNode | undefined =>
  nodes.find((node) => placeKey(node) === key);

/** Närmaste föräldern inom platsstrukturen. Den tekniska roten returneras aldrig som valbar plats. */
export const getParentPlaceNode = (nodes: PlaceNode[], node: PlaceNode): PlaceNode | undefined => {
  const parentLabel = node.path.at(-2);
  if (!parentLabel || isSameLabel(parentLabel, node.path[0])) return undefined;

  return nodes.find((candidate) => isSameLabel(candidate.label, parentLabel));
};

/** Direkta barn till en nod, som PlaceNode så att de bär med sig hela sin väg */
export const getSubPlaceNodes = (nodes: PlaceNode[], parent: PlaceNode): PlaceNode[] =>
  nodes.filter((node) => node.path.length === parent.path.length + 1 && isSameLabel(node.path.at(-2), parent.label));

/**
 * Slår upp en nod på visningsnamn. Namnet ensamt räcker inte på sista nivån, så föräldern används
 * som kvalificerare. Flera träffar räknas som ingen träff — då får användaren välja själv istället
 * för att vi gissar och sätter fel label på ärendet.
 */
export const findPlaceNode = (
  nodes: PlaceNode[],
  name: string | undefined,
  parentName?: string,
): PlaceNode | undefined => {
  const wanted = normalizeLabelName(name);
  if (!wanted) return undefined;

  const matches = nodes.filter((node) => normalizeLabelName(placeName(node)) === wanted);
  if (matches.length <= 1) return matches[0];

  const wantedParent = normalizeLabelName(parentName);
  if (!wantedParent) return undefined;

  const withParent = matches.filter((node) => normalizeLabelName(placeParentName(node)) === wantedParent);
  return withParent.length === 1 ? withParent[0] : undefined;
};

export const isDescendantOrSelf = (node: PlaceNode, ancestor: PlaceNode): boolean =>
  node.path.some((label) => isSameLabel(label, ancestor.label));

/** Labelns egna fält utan barnen: ärendet bär bara de labels som faktiskt valts. */
export const toErrandLabel = (label: Label): Label => ({
  id: label.id,
  classification: label.classification,
  displayName: label.displayName,
  resourcePath: label.resourcePath,
  resourceName: label.resourceName,
});

/** Labelkedjan som sätts på ärendet: roten och varje nod ner till valet, utan underliggande barn */
export const toErrandLabels = (node: PlaceNode): Label[] => node.path.map(toErrandLabel);

export interface ErrandWithReportType {
  parameters?: { key: string; values?: string[] }[];
  labels?: { resourceName?: string }[];
}

/**
 * Rapporttypen står på två ställen i ärendet: som parametern eventType, som radioknapparna i
 * "Om ärendet" sätter, och som labels under REPORT_TYPE, som är det handläggarvyn filtrerar på.
 * Den här filen håller ihop de två så att de inte glider isär igen.
 */

export const EVENT_TYPE_PARAMETER_KEY = 'eventType';

/** Värdena på parametern eventType. */
export const EVENT_TYPE_DEVIATION = 'AVVIKELSE';
export const EVENT_TYPE_MISCONDUCT = 'MISSFORHALLANDE';

/** Rapporttypens rot i labelstrukturen, och de två typerna under den. */
export const REPORT_TYPE_ROOT_RESOURCE_NAME = 'REPORT_TYPE';
export const REPORT_TYPE_DEVIATION = 'DEVIATION';
export const REPORT_TYPE_MISCONDUCT = 'ABUSE';

const REPORT_TYPE_BY_EVENT_TYPE: Record<string, string | undefined> = {
  [EVENT_TYPE_DEVIATION]: REPORT_TYPE_DEVIATION,
  [EVENT_TYPE_MISCONDUCT]: REPORT_TYPE_MISCONDUCT,
};

export const getReportTypeResourceName = (eventType: string | undefined): string | undefined =>
  eventType ? REPORT_TYPE_BY_EVENT_TYPE[eventType] : undefined;

export const getEventType = (errand: ErrandWithReportType): string | undefined =>
  errand.parameters?.find((parameter) => parameter.key === EVENT_TYPE_PARAMETER_KEY)?.values?.[0];

const isReportTypeLabel = (label: { resourceName?: string }): boolean =>
  label.resourceName === REPORT_TYPE_DEVIATION || label.resourceName === REPORT_TYPE_MISCONDUCT;

const EVENT_TYPE_BY_REPORT_TYPE: Record<string, string | undefined> = {
  [REPORT_TYPE_DEVIATION]: EVENT_TYPE_DEVIATION,
  [REPORT_TYPE_MISCONDUCT]: EVENT_TYPE_MISCONDUCT,
};

const getEventTypeFromLabels = (errand: ErrandWithReportType): string | undefined => {
  const resourceName = errand.labels?.find(isReportTypeLabel)?.resourceName;
  return resourceName ? EVENT_TYPE_BY_REPORT_TYPE[resourceName] : undefined;
};

/**
 * Rapporttypen som radioknapparna och valideringen läser den. Parametern går först: den bär det
 * val användaren just gjort, medan labeln skrivs om först när ärendet sparas. Labeln finns kvar som
 * fallback, eftersom ett ärende kan komma tillbaka från API:t utan parametern men alltid bär
 * typen som label.
 */
export const getSelectedEventType = (errand: ErrandWithReportType): string =>
  getEventType(errand) ?? getEventTypeFromLabels(errand) ?? '';

/**
 * Labeln är rapporttypen så som API:t ser den och läses därför i första hand. Ärenden som
 * registrerades innan typen började sättas som label bär den bara som parameter, och ska visas
 * rätt ändå.
 */
export const getErrandReportType = (errand: ErrandWithReportType): string | undefined =>
  errand.labels?.find(isReportTypeLabel)?.resourceName ?? getReportTypeResourceName(getEventType(errand));

export const isMisconduct = (errand: ErrandWithReportType): boolean =>
  getErrandReportType(errand) === REPORT_TYPE_MISCONDUCT;

export const FACILITY_SCHEMA_NAME = 'avvikelse-plats-handelse';
export interface FacilityInfo {
  orgName?: string;
  parentOrgName?: string;
}
export type FacilitySelectionStatus = 'NONE' | 'INCOMPLETE' | 'COMPLETE';

/** De sparade JSON-uppgifterna är källan även när fältets lokala namn ändras. */
export const getFacilityInfoFromJsonParameters = (
  parameters: readonly { key: string; value: unknown }[] | undefined,
): FacilityInfo | undefined => {
  const value = parameters?.find((parameter) => parameter.key === FACILITY_SCHEMA_NAME)?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  for (const entry of Object.values(value)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !('orgName' in entry)) continue;
    const input = entry as Record<string, unknown>;
    if (typeof input.orgName !== 'string') return undefined;
    return {
      orgName: input.orgName,
      ...(typeof input.parentOrgName === 'string' ? { parentOrgName: input.parentOrgName } : {}),
    };
  }
  return undefined;
};

const findLabel = (labels: readonly Label[] | undefined, resourceName: string): Label | undefined => {
  for (const label of labels ?? []) {
    if (label.resourceName === resourceName) return label;
    const child = findLabel(label.labels, resourceName);
    if (child) return child;
  }
  return undefined;
};

/** En enda verksamhetsregel för webbläsarens payload och serverns kontroll mot aktuell metadata. */
export const resolveAvvikelseLabels = (
  structure: Label[] | undefined,
  eventType: string,
  facility: FacilityInfo | undefined,
): {
  labels: Label[];
  facilityStatus: FacilitySelectionStatus;
  reportTypeConfigured: boolean;
} => {
  const rootLabel = findLabel(structure, REPORT_TYPE_ROOT_RESOURCE_NAME);
  const typeLabel = rootLabel?.labels?.find((label) => label.resourceName === getReportTypeResourceName(eventType));
  const placeNode = facility
    ? findPlaceNode(getPlaceNodes(structure), facility.orgName, facility.parentOrgName)
    : undefined;
  const labels = [
    ...(rootLabel && typeLabel ? [toErrandLabel(rootLabel), toErrandLabel(typeLabel)] : []),
    ...(placeNode ? toErrandLabels(placeNode) : []),
  ];
  let facilityStatus: FacilitySelectionStatus = 'NONE';
  if (facility?.orgName) facilityStatus = !placeNode || hasSubPlaces(placeNode) ? 'INCOMPLETE' : 'COMPLETE';
  const seen = new Set<string>();
  return {
    labels: labels.filter((label) => {
      const key = label.resourcePath ?? label.resourceName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    facilityStatus,
    reportTypeConfigured: Boolean(rootLabel && typeLabel),
  };
};

export type AvvikelsePartyIssue = 'EVENT_TYPE_REQUIRED' | 'EVENT_CONCERNS_REQUIRED' | 'PRIMARY_REQUIRED';

/** Kända maskinvärden och partsbehov har samma ägare i klienten och på servern. */
export const getAvvikelsePartyIssues = (
  errand: ErrandWithReportType & { stakeholders?: { role?: string }[] },
): AvvikelsePartyIssue[] => {
  const issues: AvvikelsePartyIssue[] = [];
  const eventTypes = errand.parameters?.filter((parameter) => parameter.key === EVENT_TYPE_PARAMETER_KEY) ?? [];
  const eventType = getSelectedEventType(errand);
  if (
    !getReportTypeResourceName(eventType) ||
    eventTypes.length > 1 ||
    (eventTypes[0] && eventTypes[0].values?.length !== 1)
  )
    issues.push('EVENT_TYPE_REQUIRED');
  const concernsParameters = errand.parameters?.filter((parameter) => parameter.key === 'eventConcerns') ?? [];
  const concerns = concernsParameters[0]?.values?.[0];
  if (
    concernsParameters.length !== 1 ||
    concernsParameters[0]?.values?.length !== 1 ||
    !['ENSKILD_BRUKARE', 'GRUPP_VERKSAMHET'].includes(concerns ?? '')
  )
    issues.push('EVENT_CONCERNS_REQUIRED');
  if (concerns === 'ENSKILD_BRUKARE' && !errand.stakeholders?.some((stakeholder) => stakeholder.role === 'PRIMARY'))
    issues.push('PRIMARY_REQUIRED');
  return issues;
};
