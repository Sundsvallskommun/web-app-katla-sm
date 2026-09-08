/** Product choices only. URLs, access groups and secrets belong to server configuration. */
export interface KatlaDefinitionInput {
  /** Stable, unique lowercase id (letters, digits and hyphens). Never rename an id with saved data. */
  readonly id: string;
  /** Name shown in the application and Mina Katlor. */
  readonly applicationName: string;
  /** Short description shown in Mina Katlor; omitted by default. */
  readonly description?: string;
  /** schema: reporter and schema fields. avvikelse: adds report types, parties and locations. */
  readonly flow: 'schema' | 'avvikelse';
  /** Ordered, nonempty list of published schema names. Saved records retain their exact schemaId. */
  readonly forms: readonly { readonly schemaName: string }[];
  /** Only specify deviations from the documented defaults in KatlaFeatures. */
  readonly features?: Partial<KatlaFeatures>;
  /** Fixed values for newly created errands; existing errands are never rewritten. */
  readonly errandDefaults?: Partial<KatlaErrandDefaults>;
  /** Development/test fixture. Never publish in the production catalogue. Default: false. */
  readonly testOnly?: boolean;
}

export interface KatlaFeatures {
  /** Allow saving drafts. Default true. Recipient must support DRAFT. */
  readonly draftEnabled: boolean;
  /** Display filters in the errand list. Default true. */
  readonly errandFilter: boolean;
  /** Show the compact stakeholder form. Default true. */
  readonly reducedStakeholderInfo: boolean;
  /** Mark completed form disclosures. Default false. */
  readonly disclosureDoneMark: boolean;
  /** Show additional parties in the avvikelse flow. Default false; requires flow avvikelse. */
  readonly otherPartiesDisclosure: boolean;
}

export interface KatlaErrandDefaults {
  /** Default title: Ärende. Confirm with the recipient before connecting a Katla. */
  readonly title: string;
  /** Default MEDIUM. Must be LOW, MEDIUM or HIGH. */
  readonly priority: 'MEDIUM' | 'LOW' | 'HIGH';
  /** Default ESERVICE. Must be supported by recipient metadata. */
  readonly channel: string;
  /** Default INFORMED. Must be supported by recipient metadata. */
  readonly resolution: string;
}

/** Fully validated and resolved definition consumed by both applications. */
export interface KatlaDefinition extends Omit<KatlaDefinitionInput, 'features' | 'errandDefaults'> {
  readonly features: KatlaFeatures;
  readonly errandDefaults: KatlaErrandDefaults;
}

const defaultFeatures: KatlaFeatures = {
  draftEnabled: true,
  errandFilter: true,
  reducedStakeholderInfo: true,
  disclosureDoneMark: false,
  otherPartiesDisclosure: false,
};

const defaultErrand: KatlaErrandDefaults = {
  title: 'Ärende',
  priority: 'MEDIUM',
  channel: 'ESERVICE',
  resolution: 'INFORMED',
};

function object(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function knownKeys(value: Record<string, unknown>, keys: readonly string[], name: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${name}.${key} is unknown. Check the definition field name.`);
  }
}

function nonempty(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() !== value || !value.length) {
    throw new Error(`${name} must be a nonempty string without surrounding whitespace.`);
  }
  return value;
}

function boolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${name} must be true or false.`);
  return value;
}

/** Validate untrusted values and apply defaults once. Unknown fields fail instead of being silently ignored. */
export function resolveKatlaDefinition(input: unknown): KatlaDefinition {
  const value = object(input, 'definition');
  knownKeys(
    value,
    ['id', 'applicationName', 'description', 'flow', 'forms', 'features', 'errandDefaults', 'testOnly'],
    'definition',
  );
  const id = nonempty(value.id, 'definition.id');
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error('definition.id must contain lowercase letters, digits and single hyphens, starting with a letter.');
  }
  if (value.flow !== 'schema' && value.flow !== 'avvikelse') throw new Error(`${id}.flow must be schema or avvikelse.`);
  if (!Array.isArray(value.forms) || !value.forms.length)
    throw new Error(`${id}.forms must contain at least one schema reference.`);
  const forms = value.forms.map((form: unknown, index: number) => {
    const item = object(form, `${id}.forms[${index}]`);
    knownKeys(item, ['schemaName'], `${id}.forms[${index}]`);
    return Object.freeze({
      schemaName: nonempty(item.schemaName, `${id}.forms[${index}].schemaName`),
    });
  });
  if (new Set(forms.map((form) => form.schemaName)).size !== forms.length)
    throw new Error(`${id}.forms contains duplicate schema names.`);
  const featureInput = {
    ...defaultFeatures,
    ...(value.features === undefined ? {} : object(value.features, `${id}.features`)),
  };
  knownKeys(featureInput, Object.keys(defaultFeatures), `${id}.features`);
  const features: KatlaFeatures = {
    draftEnabled: boolean(featureInput.draftEnabled, `${id}.features.draftEnabled`),
    errandFilter: boolean(featureInput.errandFilter, `${id}.features.errandFilter`),
    reducedStakeholderInfo: boolean(featureInput.reducedStakeholderInfo, `${id}.features.reducedStakeholderInfo`),
    disclosureDoneMark: boolean(featureInput.disclosureDoneMark, `${id}.features.disclosureDoneMark`),
    otherPartiesDisclosure: boolean(featureInput.otherPartiesDisclosure, `${id}.features.otherPartiesDisclosure`),
  };
  if (value.flow === 'schema' && features.otherPartiesDisclosure)
    throw new Error(`${id}.features.otherPartiesDisclosure requires the avvikelse flow.`);
  const defaults = {
    ...defaultErrand,
    ...(value.errandDefaults === undefined ? {} : object(value.errandDefaults, `${id}.errandDefaults`)),
  };
  knownKeys(defaults, Object.keys(defaultErrand), `${id}.errandDefaults`);
  const priority = defaults.priority;
  if (priority !== 'LOW' && priority !== 'MEDIUM' && priority !== 'HIGH')
    throw new Error(`${id}.errandDefaults.priority must be LOW, MEDIUM or HIGH.`);
  return Object.freeze({
    id,
    applicationName: nonempty(value.applicationName, `${id}.applicationName`),
    ...(value.description === undefined ? {} : { description: nonempty(value.description, `${id}.description`) }),
    flow: value.flow,
    forms: Object.freeze(forms),
    features: Object.freeze(features),
    errandDefaults: Object.freeze({
      title: nonempty(defaults.title, `${id}.errandDefaults.title`),
      priority,
      channel: nonempty(defaults.channel, `${id}.errandDefaults.channel`),
      resolution: nonempty(defaults.resolution, `${id}.errandDefaults.resolution`),
    }),
    ...(value.testOnly === undefined ? {} : { testOnly: boolean(value.testOnly, `${id}.testOnly`) }),
  });
}
