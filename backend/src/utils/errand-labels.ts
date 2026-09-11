import { ErrandLabel, Label } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

interface LabelNode {
  label: Label;
  path: Label[];
}

const invalidLabels = () => new HttpException(400, 'A complete valid location label chain is required');
const invalidStructure = () => new HttpException(502, 'Cannot validate errand labels against current metadata');
const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isLabelInput = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Säkerhetsgränsen för alla ärendeskrivningar, oavsett status. Klientens labels måste motsvara
 * exakt en hel LOCATION-gren ner till en aktiv lövnod. Även övriga labels verifieras, så en
 * okänd eller förfalskad label inte kan smygas förbi genom att påstå en annan classification.
 * Utgående objekt byggs från aktuell metadata, aldrig från klientens labelattribut.
 */
export const validateErrandLabels = (submitted: unknown, structure: Label[] | undefined): ErrandLabel[] => {
  if (!Array.isArray(submitted) || submitted.length === 0) throw invalidLabels();
  if (!Array.isArray(structure)) throw invalidStructure();

  const nodesByPath = new Map<string, LabelNode>();
  const ids = new Set<string>();
  const visit = (label: Label, ancestors: Label[]) => {
    if (
      !label ||
      !hasText(label.resourcePath) ||
      !hasText(label.resourceName) ||
      !hasText(label.classification) ||
      (label.id !== undefined && !hasText(label.id)) ||
      (label.labels !== undefined && !Array.isArray(label.labels)) ||
      nodesByPath.has(label.resourcePath) ||
      (label.id !== undefined && ids.has(label.id))
    ) {
      throw invalidStructure();
    }
    if (label.id !== undefined) ids.add(label.id);
    const path = [...ancestors, label];
    nodesByPath.set(label.resourcePath, { label, path });
    label.labels?.forEach(child => {
      visit(child, path);
    });
  };
  structure.forEach(label => {
    visit(label, []);
  });

  const roots = structure.filter(label => label.resourceName === 'LOCATION');
  const root = roots[0];
  if (roots.length !== 1 || !root?.labels?.length) throw invalidStructure();

  const selectedPaths = new Set<string>();
  const selected = submitted.map((value: unknown): LabelNode => {
    if (!isLabelInput(value) || !hasText(value.resourcePath)) {
      throw invalidLabels();
    }
    const node = nodesByPath.get(value.resourcePath);
    if (!node || selectedPaths.has(value.resourcePath) || node.path.some(label => label.deprecated)) throw invalidLabels();

    // Om klienten skickar flera identitetsfält måste de peka på samma label.
    for (const key of ['id', 'resourceName', 'classification'] as const) {
      if (key in value && value[key] !== node.label[key]) throw invalidLabels();
    }
    selectedPaths.add(value.resourcePath);
    return node;
  });

  const locations = selected.filter(node => node.path[0] === root);
  const leaves = locations.filter(node => node.path.length > 1 && !node.label.labels?.length);
  const leaf = leaves[0];
  if (leaves.length !== 1 || !leaf) throw invalidLabels();
  if (locations.length !== leaf.path.length || !leaf.path.every(label => label.resourcePath !== undefined && selectedPaths.has(label.resourcePath))) {
    throw invalidLabels();
  }

  return selected.map(({ label }) => ({
    id: label.id,
    classification: label.classification,
    displayName: label.displayName,
    resourcePath: label.resourcePath,
    resourceName: label.resourceName,
  }));
};
