/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type JsonNode = any;

/** UiSchemaRequest model */
export interface UiSchemaRequest {
  /**
   * The UI schema
   * @example {"firstName":{"ui:widget":"text","ui:placeholder":"Enter first name"},"lastName":{"ui:widget":"text","ui:placeholder":"Enter last name"},"ui:order":["firstName","lastName"]}
   */
  value: JsonNode;
  /** Description of the UI schema purpose */
  description?: string;
}

export interface Problem {
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  parameters?: Record<string, any>;
  status?: StatusType;
  title?: string;
  detail?: string;
}

export interface StatusType {
  /** @format int32 */
  statusCode?: number;
  reasonPhrase?: string;
}

export interface ConstraintViolationProblem {
  cause?: ThrowableProblem;
  stackTrace?: {
    classLoaderName?: string;
    moduleName?: string;
    moduleVersion?: string;
    methodName?: string;
    fileName?: string;
    /** @format int32 */
    lineNumber?: number;
    className?: string;
    nativeMethod?: boolean;
  }[];
  /** @format uri */
  type?: string;
  status?: StatusType;
  violations?: Violation[];
  title?: string;
  message?: string;
  /** @format uri */
  instance?: string;
  parameters?: Record<string, any>;
  detail?: string;
  suppressed?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    localizedMessage?: string;
  }[];
  localizedMessage?: string;
}

export interface ThrowableProblem {
  cause?: any;
  stackTrace?: {
    classLoaderName?: string;
    moduleName?: string;
    moduleVersion?: string;
    methodName?: string;
    fileName?: string;
    /** @format int32 */
    lineNumber?: number;
    className?: string;
    nativeMethod?: boolean;
  }[];
  message?: string;
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  parameters?: Record<string, any>;
  status?: StatusType;
  title?: string;
  detail?: string;
  suppressed?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    localizedMessage?: string;
  }[];
  localizedMessage?: string;
}

export interface Violation {
  field?: string;
  message?: string;
}

/** JsonSchemaRequest model */
export interface JsonSchemaRequest {
  /**
   * Schema name
   * @minLength 1
   */
  name: string;
  /**
   * Schema version on the format [major version].[minor version]
   * @minLength 1
   * @pattern ^(\d+\.)?(\d+)$
   */
  version: string;
  /**
   * The JSON schema, specified by: https://json-schema.org/draft/2020-12/schema
   * @example {"$id":"https://example.com/person.schema.json","$schema":"https://json-schema.org/draft/2020-12/schema","title":"Person","type":"object","properties":{"firstName":{"type":"string","description":"The person's first name."},"lastName":{"type":"string","description":"The person's last name."}}}
   */
  value: JsonNode;
  /** Description of the schema purpose */
  description?: string;
}

/** JsonSchema model */
export interface JsonSchema {
  /** Schema ID. The ID is composed by the municipalityId, schema name and version. I.e.: [municipality_id]_[schema_name]_[schema_version] */
  id?: string;
  /** Schema name */
  name?: string;
  /** Schema version on the format [major version].[minor version] */
  version?: string;
  /**
   * The JSON schema, specified by: https://json-schema.org/draft/2020-12/schema
   * @example {"$id":"https://example.com/person.schema.json","$schema":"https://json-schema.org/draft/2020-12/schema","title":"Person","type":"object","properties":{"firstName":{"type":"string","description":"The person's first name."},"lastName":{"type":"string","description":"The person's last name."}}}
   */
  value?: JsonNode;
  /** Description of the schema purpose */
  description?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Number of times this schema has been used to validate a JSON instance
   * @format int64
   */
  validationUsageCount?: number;
  /**
   * Timestamp when this schema was last used to validate a JSON instance
   * @format date-time
   */
  lastUsedForValidation?: string;
}

export interface PageJsonSchema {
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
  /** @format int32 */
  size?: number;
  content?: JsonSchema[];
  /** @format int32 */
  number?: number;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  numberOfElements?: number;
  sort?: SortObject;
  pageable?: PageableObject;
  empty?: boolean;
}

export interface PageableObject {
  /** @format int64 */
  offset?: number;
  sort?: SortObject;
  paged?: boolean;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  unpaged?: boolean;
}

export interface SortObject {
  empty?: boolean;
  sorted?: boolean;
  unsorted?: boolean;
}

/** UiSchema model */
export interface UiSchema {
  /** UI Schema ID */
  id?: string;
  /**
   * The UI schema
   * @example {"firstName":{"ui:widget":"text","ui:placeholder":"Enter first name"},"lastName":{"ui:widget":"text","ui:placeholder":"Enter last name"},"ui:order":["firstName","lastName"]}
   */
  value?: JsonNode;
  /** Description of the UI schema purpose */
  description?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
}
