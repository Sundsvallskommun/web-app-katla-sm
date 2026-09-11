import { ErrandLabel, Label, MetadataResponse } from '@/data-contracts/supportmanagement/data-contracts';

import { errandPhases } from './errand-phases';

export const locationLabels: Label[] = [
  { id: 'location', resourcePath: 'LOCATION', resourceName: 'LOCATION', classification: 'location-root', displayName: 'Platsstruktur' },
  { id: 'unit', resourcePath: 'LOCATION/UNIT', resourceName: 'UNIT', classification: 'place', displayName: 'Enhet' },
  { id: 'blue', resourcePath: 'LOCATION/UNIT/BLUE', resourceName: 'BLUE', classification: 'place', displayName: 'Blå' },
];

const [root, unit, leaf] = locationLabels;
if (!root || !unit || !leaf) throw new Error('Expected root, unit and leaf in location fixture');

const reportType: Label = { id: 'report-type', resourcePath: 'REPORT_TYPE', resourceName: 'REPORT_TYPE', classification: 'report-type-root' };
const deviation: Label = { id: 'deviation', resourcePath: 'REPORT_TYPE/DEVIATION', resourceName: 'DEVIATION', classification: 'report-type' };
export const siblingLabel: Label = { id: 'yellow', resourcePath: 'LOCATION/UNIT/YELLOW', resourceName: 'YELLOW', classification: 'place' };

export const errandLabelMetadata: MetadataResponse = {
  phases: errandPhases,
  labels: {
    labelStructure: [
      { ...root, labels: [{ ...unit, labels: [leaf, siblingLabel] }] },
      { ...reportType, labels: [deviation] },
    ],
  },
};

export const validErrandLabels: ErrandLabel[] = [reportType, deviation, ...locationLabels];
