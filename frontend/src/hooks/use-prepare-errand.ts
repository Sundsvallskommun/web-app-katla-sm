import { errandFormDataToJsonParameters, isJsonObject, parseErrandFormData } from '@components/json/utils/schema-utils';
import { FacilityInfoDTO, LabelDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import {
  findPlaceNode,
  getPlaceNodes,
  hasSubPlaces,
  qualifiedPlaceName,
  toErrandLabel,
  toErrandLabels,
} from '@utils/label-structure';
import {
  EVENT_TYPE_PARAMETER_KEY,
  getReportTypeResourceName,
  REPORT_TYPE_ROOT_RESOURCE_NAME,
} from '@utils/report-type';
import { useMemo } from 'react';
import { useMetadataStore } from 'src/stores/metadata-store';

const FACILITY_SCHEMA_NAME = 'avvikelse-plats-handelse';

/**
 * NONE = ingen plats vald, INCOMPLETE = vald plats saknar det aktiva valet av underenhet (eller
 * matchar ingen label), COMPLETE = platsen pekar ut en label längst ner i platsstrukturen.
 */
export type FacilitySelectionStatus = 'NONE' | 'INCOMPLETE' | 'COMPLETE';

const isFacilityInfo = (value: unknown): value is FacilityInfoDTO =>
  !!value && typeof value === 'object' && 'orgName' in value;

export function usePrepareErrand() {
  const { metadata } = useMetadataStore();

  const placeNodes = useMemo(() => getPlaceNodes(metadata?.labels?.labelStructure), [metadata?.labels?.labelStructure]);

  const findLabel = (resourceName: string): LabelDTO | undefined => {
    const findInStructure = (labels: LabelDTO[]): LabelDTO | undefined => {
      for (const label of labels) {
        if (label.resourceName === resourceName) return label;
        if (label.labels?.length) {
          const found = findInStructure(label.labels);
          if (found) return found;
        }
      }
      return undefined;
    };
    return metadata?.labels?.labelStructure ? findInStructure(metadata.labels.labelStructure) : undefined;
  };

  const dedupeLabels = (labels: LabelDTO[]): LabelDTO[] => {
    const seen = new Set<string>();
    return labels.filter((label) => {
      const key = label.resourcePath ?? label.resourceName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getFacilityInfo = (errandFormData: ErrandFormDataItem[] | undefined): FacilityInfoDTO | undefined => {
    const platsEntry = errandFormData?.find((e) => e.schemaName === FACILITY_SCHEMA_NAME);
    if (!platsEntry?.data) return undefined;

    // Parsningen går genom schemakontraktet i stället för rå JSON.parse, så att ogiltig
    // eller icke-objektformad persisterad data faller ut som "ingen plats" i stället för
    // att kastas vidare härifrån.
    const parsedData = parseErrandFormData(platsEntry.data, platsEntry.schemaName);
    if (!parsedData.valid || !isJsonObject(parsedData.value)) return undefined;

    for (const value of Object.values(parsedData.value)) {
      if (isFacilityInfo(value)) {
        return value;
      }
    }
    return undefined;
  };

  const getFacilityPlaceNode = (errandFormData: ErrandFormDataItem[] | undefined) => {
    const facilityInfo = getFacilityInfo(errandFormData);
    return facilityInfo ? findPlaceNode(placeNodes, facilityInfo.orgName, facilityInfo.parentOrgName) : undefined;
  };

  /** Namn kvalificerat med föräldern, eftersom sista nivån ("Blå") inte är unik i sig */
  const getFacilityOrgName = (errandFormData: ErrandFormDataItem[] | undefined): string | undefined => {
    const placeNode = getFacilityPlaceNode(errandFormData);
    return placeNode ? qualifiedPlaceName(placeNode) : getFacilityInfo(errandFormData)?.orgName;
  };

  const getFacilityStatus = (errandFormData: ErrandFormDataItem[] | undefined): FacilitySelectionStatus => {
    if (!getFacilityInfo(errandFormData)?.orgName) return 'NONE';

    const placeNode = getFacilityPlaceNode(errandFormData);
    if (!placeNode) return 'INCOMPLETE';

    return hasSubPlaces(placeNode) ? 'INCOMPLETE' : 'COMPLETE';
  };

  /**
   * Rapporttypen skickas som kedjan rot → vald typ, på samma sätt som platsen, så att båda
   * dimensionerna går att läsa likadant hos mottagaren. Saknas något led i strukturen sätts ingen
   * rapporttyp alls — hellre tom än gissad.
   */
  const buildReportTypeLabels = (eventType: string): LabelDTO[] => {
    const reportTypeResourceName = getReportTypeResourceName(eventType);
    if (!reportTypeResourceName) return [];

    const rootLabel = findLabel(REPORT_TYPE_ROOT_RESOURCE_NAME);
    const typeLabel = rootLabel?.labels?.find((label) => label.resourceName === reportTypeResourceName);
    if (!rootLabel || !typeLabel) return [];

    return [toErrandLabel(rootLabel), toErrandLabel(typeLabel)];
  };

  const buildLabels = (eventType: string, errandFormData: ErrandFormDataItem[] | undefined): LabelDTO[] => {
    const labels: LabelDTO[] = [...buildReportTypeLabels(eventType)];

    // Platsvalet styr behörigheten till ärendet: hela kedjan från platsstrukturens rot ner till
    // vald nod följer med som labels.
    const placeNode = getFacilityPlaceNode(errandFormData);
    if (placeNode) {
      labels.push(...toErrandLabels(placeNode));
    }

    return dedupeLabels(labels);
  };

  const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
    const { errandFormData, reportingForColleague: _reportingForColleague, ...errandWithoutFormData } = values;
    const eventType = values.parameters?.find((p) => p.key === EVENT_TYPE_PARAMETER_KEY)?.values?.[0] ?? '';
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

    let stakeholders = errandWithoutFormData.stakeholders ?? [];

    if (eventConcerns === 'GRUPP_VERKSAMHET') {
      const orgName = getFacilityOrgName(errandFormData);
      if (orgName) {
        const facilityStakeholder: StakeholderDTO = {
          firstName: orgName,
          role: 'PRIMARY',
        };
        stakeholders = [...stakeholders.filter((s) => s.role !== 'PRIMARY'), facilityStakeholder];
      }
    }

    return {
      ...errandWithoutFormData,
      stakeholders,
      status,
      labels: buildLabels(eventType, errandFormData),
      jsonParameters: errandFormDataToJsonParameters(errandFormData),
    };
  };

  return { prepareErrandForApi, getFacilityStatus };
}
