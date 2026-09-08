import { errandFormDataToJsonParameters, parseErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDataItem, ErrandFormDTO } from '@interfaces/errand-form';
import {
  findPlaceNode,
  getFacilityInfoFromJsonParameters,
  getPlaceNodes,
  getSelectedEventType,
  qualifiedPlaceName,
  resolveAvvikelseLabels,
} from '@katla/definitions/avvikelse';
import { useCallback } from 'react';
import { appConfig } from 'src/config/appconfig';
import { useMetadataStore } from 'src/stores/metadata-store';

const facilityInfo = (entries: ErrandFormDataItem[] | undefined) =>
  getFacilityInfoFromJsonParameters(
    (entries ?? []).flatMap((entry) => {
      const parsed = parseErrandFormData(entry.data, entry.schemaName);
      return parsed.valid ? [{ key: entry.schemaName, value: parsed.value }] : [];
    })
  );

export function usePrepareErrand() {
  const { metadata } = useMetadataStore();
  const labels = metadata?.labels?.labelStructure;

  const getClassification = useCallback(
    (values: ErrandFormDTO) =>
      resolveAvvikelseLabels(labels, getSelectedEventType(values), facilityInfo(values.errandFormData)),
    [labels]
  );

  const prepareErrandForApi = useCallback(
    (values: ErrandFormDTO, status: string) => {
      const { errandFormData, reportingForColleague: _reportingForColleague, ...errand } = values;
      const jsonParameters = errandFormDataToJsonParameters(errandFormData);
      if (appConfig.katla?.flow !== 'avvikelse') {
        return { ...errand, status, jsonParameters };
      }

      const facility = getFacilityInfoFromJsonParameters(jsonParameters);
      let stakeholders = errand.stakeholders ?? [];
      const concerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];
      if (concerns === 'GRUPP_VERKSAMHET' && facility?.orgName) {
        const node = findPlaceNode(getPlaceNodes(labels), facility.orgName, facility.parentOrgName);
        stakeholders = [
          ...stakeholders.filter((s) => s.role !== 'PRIMARY'),
          { firstName: node ? qualifiedPlaceName(node) : facility.orgName, role: 'PRIMARY' },
        ];
      }
      return {
        ...errand,
        stakeholders,
        status,
        jsonParameters,
        labels: resolveAvvikelseLabels(labels, getSelectedEventType(values), facility).labels,
      };
    },
    [labels]
  );

  return { prepareErrandForApi, getClassification };
}
