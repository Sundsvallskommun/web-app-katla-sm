import {
  getAvvikelsePartyIssues,
  getFacilityInfoFromJsonParameters,
  getSelectedEventType,
  resolveAvvikelseLabels,
} from '@katla/definitions/avvikelse';
import { applyDateBounds, createSchemaAjv } from '@katla/definitions/schema-validation';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { loadRuntimeConfiguration } from '@/config/katla-config';
import { JsonSchema, UiSchema } from '@/data-contracts/jsonschema/data-contracts';
import { Errand, JsonParameter, MetadataResponse } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@/services/api.service';
import { mapSchemaResponse, mapUiSchema } from '@/utils/schema-response-mapping';
import { apiURL } from '@/utils/util';

const isJsonParameter = (value: unknown): value is JsonParameter => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.key === 'string' &&
    candidate.key.trim().length > 0 &&
    typeof candidate.schemaId === 'string' &&
    candidate.schemaId.trim().length > 0 &&
    Object.prototype.hasOwnProperty.call(candidate, 'value')
  );
};

/** Validerar immutable schema-id:n utan coercion/defaults som kan ändra sparade uppgifter. */
const validateJsonParameters = async (req: RequestWithUser, parameters: JsonParameter[], validateValues: boolean): Promise<void> => {
  const api = new ApiService();
  for (const parameter of parameters) {
    if (!parameter.key?.trim() || !parameter.schemaId?.trim()) throw new HttpException(400, 'SCHEMA_REFERENCE_REQUIRED');
    const response = await api.get<JsonSchema>(
      {
        baseURL: apiURL(getApiBase('jsonschema')),
        url: `${MUNICIPALITY_ID}/schemas/${encodeURIComponent(parameter.schemaId)}`,
      },
      req,
    );
    const mapped = mapSchemaResponse(response.data, parameter.schemaId);
    if (response.data?.name !== parameter.key) throw new HttpException(400, 'SCHEMA_NAME_MISMATCH');
    if (!validateValues) continue;
    if (mapped.schema.$async === true) throw new HttpException(502, 'SCHEMA_VALIDATION_UNAVAILABLE');
    let ajv: ReturnType<typeof createSchemaAjv>;
    try {
      ajv = createSchemaAjv(mapped.schema.$schema);
    } catch {
      throw new HttpException(502, 'SCHEMA_DIALECT_UNSUPPORTED');
    }
    let uiSchema: Record<string, unknown> = {};
    try {
      const ui = await api.get<UiSchema>(
        {
          baseURL: apiURL(getApiBase('jsonschema')),
          url: `${MUNICIPALITY_ID}/schemas/${encodeURIComponent(parameter.schemaId)}/ui-schema`,
        },
        req,
      );
      uiSchema = mapUiSchema(ui.data);
    } catch (error) {
      if (!(error instanceof HttpException) || error.status !== 404) throw error;
    }
    let valid: boolean | Promise<unknown>;
    try {
      valid = ajv.compile(applyDateBounds(mapped.schema, uiSchema))(parameter.value);
    } catch {
      throw new HttpException(502, 'SCHEMA_VALIDATION_UNAVAILABLE');
    }
    if (!valid) throw new HttpException(400, `SCHEMA_DATA_INVALID: ${parameter.key}`);
  }
};

/** Servern beslutar om livscykel, forms och rättighetslabels före alla skrivvägar. */
export const prepareErrandWrite = async (req: RequestWithUser, input: Partial<Errand>, previous?: Errand): Promise<Partial<Errand>> => {
  const configuration = loadRuntimeConfiguration();
  if (configuration.mode !== 'katla') throw new HttpException(404, 'Not found');
  const definition = configuration.definition;
  const status = input.status ?? previous?.status;
  if (status !== 'DRAFT' && status !== 'NEW') throw new HttpException(400, 'ERRAND_STATUS_NOT_ALLOWED');
  if (previous && previous.status !== 'DRAFT') throw new HttpException(409, 'ERRAND_ALREADY_SUBMITTED');
  if (status === 'DRAFT' && !definition.features.draftEnabled && !previous) throw new HttpException(400, 'DRAFTS_DISABLED');
  const parameters = input.jsonParameters ?? previous?.jsonParameters ?? [];
  if (!Array.isArray(parameters) || !parameters.every(isJsonParameter)) throw new HttpException(400, 'JSON_PARAMETERS_INVALID');
  const keys = new Set(parameters.map(parameter => parameter.key));
  if (keys.size !== parameters.length) throw new HttpException(400, 'DUPLICATE_SCHEMA_PARAMETER');
  for (const saved of previous?.jsonParameters ?? []) {
    const incoming = parameters.find(parameter => parameter.key === saved.key);
    if (incoming?.schemaId !== saved.schemaId) throw new HttpException(409, 'SAVED_SCHEMA_REFERENCE_CHANGED');
  }
  const allowedKeys = new Set([
    ...definition.forms.map(form => form.schemaName),
    ...(previous?.jsonParameters ?? []).map(parameter => parameter.key),
  ]);
  if (parameters.some(parameter => !allowedKeys.has(parameter.key))) throw new HttpException(400, 'SCHEMA_NOT_CONFIGURED');
  // Sparade utkast behåller sitt formulärkontrakt. Definitionsändringar migrerar aldrig dessa implicit.
  const requiredKeys = previous?.jsonParameters?.length
    ? previous.jsonParameters.map(parameter => parameter.key)
    : definition.forms.map(form => form.schemaName);
  if (requiredKeys.some(key => !keys.has(key))) throw new HttpException(400, 'REQUIRED_SCHEMA_MISSING');
  await validateJsonParameters(req, parameters, status === 'NEW');

  const result: Partial<Errand> = {
    ...input,
    status,
    jsonParameters: parameters,
    ...(previous?.version !== undefined ? { version: input.version ?? previous.version } : {}),
  };
  if (definition.flow === 'avvikelse') {
    if (status === 'NEW') {
      const issues = getAvvikelsePartyIssues({ ...previous, ...input });
      if (issues.length) throw new HttpException(400, `AVVIKELSE_${issues[0]}`);
    }
    const response = await new ApiService().get<MetadataResponse>(
      {
        url: `${getApiBase('supportmanagement')}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`,
      },
      req,
    );
    if (!response.data?.labels?.labelStructure) throw new HttpException(502, 'LABEL_METADATA_UNAVAILABLE');
    const resolution = resolveAvvikelseLabels(
      response.data.labels.labelStructure,
      getSelectedEventType({ ...previous, ...input }),
      getFacilityInfoFromJsonParameters(parameters),
    );
    if (status === 'NEW' && (!resolution.reportTypeConfigured || resolution.facilityStatus !== 'COMPLETE'))
      throw new HttpException(400, 'AVVIKELSE_CLASSIFICATION_INVALID');
    result.labels = resolution.labels;
  } else {
    if ((input.labels?.length ?? 0) > 0) throw new HttpException(400, 'LABELS_NOT_SUPPORTED_BY_FLOW');
    result.labels = [];
  }
  return result;
};
