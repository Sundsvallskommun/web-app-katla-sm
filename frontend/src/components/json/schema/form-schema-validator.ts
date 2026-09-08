import { installHtmlLengthKeywords, schemaAjvClass } from '@katla/definitions/schema-validation';
import { customizeValidator } from '@rjsf/validator-ajv8';
import type { Options } from 'ajv';

function validatorOptions(dialect?: string) {
  const Base = schemaAjvClass(dialect);
  class HtmlAwareAjv extends Base {
    constructor(options?: Options) {
      super(options);
      installHtmlLengthKeywords(this);
    }
  }
  return {
    ajvOptionsOverrides: { allErrors: true, strict: false },
    ajvFormatOptions: { keywords: true },
    AjvClass: HtmlAwareAjv,
  };
}
const createFormSchemaValidator = (dialect?: string) =>
  customizeValidator<Record<string, unknown>>(validatorOptions(dialect));
const createJsonValueSchemaValidator = (dialect?: string) => customizeValidator<unknown>(validatorOptions(dialect));

type FormSchemaValidator = ReturnType<typeof createFormSchemaValidator>;
type JsonValueSchemaValidator = ReturnType<typeof createJsonValueSchemaValidator>;

const formSchemaValidators = new Map<string, FormSchemaValidator>();
const jsonValueSchemaValidators = new Map<string, JsonValueSchemaValidator>();

function requireSchemaId(schemaId: string): string {
  if (schemaId.trim().length === 0) {
    throw new Error('Cannot create a schema validator without an immutable schema ID');
  }
  return schemaId;
}

function getOrCreateValidator<T>(schemaId: string, validators: Map<string, T>, createValidator: () => T): T {
  const exactSchemaId = requireSchemaId(schemaId);
  const existingValidator = validators.get(exactSchemaId);
  if (existingValidator) return existingValidator;

  const validator = createValidator();
  validators.set(exactSchemaId, validator);
  return validator;
}

/**
 * AJV cachar kompilerade scheman på schemadokumentets `$id`. Katlas schema-ID är
 * den oföränderliga versionsidentiteten, så varje exakt Katla-ID äger sin egen
 * AJV-instans även när flera versioner avsiktligt delar samma `$id`.
 */
export function getFormSchemaValidator(schemaId: string, dialect?: string): FormSchemaValidator {
  return getOrCreateValidator(schemaId, formSchemaValidators, () => createFormSchemaValidator(dialect));
}

// Persisterade JSON-parametrar kan ha vilken JSON-rottyp som helst, även om det interaktiva formuläret i dag äger objektrötter.
export function getJsonValueSchemaValidator(schemaId: string, dialect?: string): JsonValueSchemaValidator {
  return getOrCreateValidator(schemaId, jsonValueSchemaValidators, () => createJsonValueSchemaValidator(dialect));
}
