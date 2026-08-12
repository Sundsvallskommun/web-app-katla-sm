import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import { additionalConverters } from '@/utils/custom-validation-classes';

interface ContractProperty {
  optional: boolean;
  type: string;
}

type ContractGraph = Record<string, Record<string, ContractProperty>>;

const requireRecord = (value: unknown, description: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${description} saknas eller har oväntat format`);
  }
  return value as Record<string, unknown>;
};

const getReferencedSchemaName = (value: unknown, description: string): string | undefined => {
  const property = requireRecord(value, description);

  if (typeof property.$ref === 'string') {
    const referenceSegments = property.$ref.split('/');
    const referencedType = referenceSegments[referenceSegments.length - 1];
    if (!referencedType) throw new Error(`${description} har en ogiltig $ref`);
    return referencedType;
  }

  if (property.type === 'array') {
    return getReferencedSchemaName(property.items, `${description}.items`);
  }

  return undefined;
};

const schemaPropertyToTypeScript = (value: unknown, description: string): string => {
  const property = requireRecord(value, description);
  const referencedType = getReferencedSchemaName(property, description);

  if (referencedType) {
    return property.type === 'array' ? `${referencedType}[]` : referencedType;
  }

  if (property.type === 'array') {
    return `${schemaPropertyToTypeScript(property.items, `${description}.items`)}[]`;
  }

  if (property.type === 'integer' || property.type === 'number') return 'number';
  if (property.type === 'string' || property.type === 'boolean') return property.type;

  throw new Error(`${description} använder en OpenAPI-typ som driftkontrollen inte hanterar`);
};

const getOpenApiSchemas = () => {
  // Importing the DTO above registers its decorator metadata before the schemas are built.
  void StakeholderDTO;
  return validationMetadatasToSchemas({
    classTransformerMetadataStorage: defaultMetadataStorage,
    refPointerPrefix: '#/components/schemas/',
    additionalConverters,
  });
};

const getBackendContract = (schemas: Record<string, unknown>): ContractGraph => {
  const contract: ContractGraph = {};
  const pendingSchemas = ['StakeholderDTO'];
  const visitedSchemas = new Set<string>();

  while (pendingSchemas.length > 0) {
    const schemaName = pendingSchemas.shift();
    if (!schemaName || visitedSchemas.has(schemaName)) continue;
    visitedSchemas.add(schemaName);

    const schema = requireRecord(schemas[schemaName], `OpenAPI-schemat ${schemaName}`);
    const properties = requireRecord(schema.properties, `${schemaName}.properties`);
    const required = new Set(Array.isArray(schema.required) ? schema.required.filter((name): name is string => typeof name === 'string') : []);

    contract[schemaName] = Object.fromEntries(
      Object.entries(properties).map(([name, property]) => {
        const description = `${schemaName}.properties.${name}`;
        const referencedSchema = getReferencedSchemaName(property, description);
        if (referencedSchema && !visitedSchemas.has(referencedSchema)) pendingSchemas.push(referencedSchema);

        return [
          name,
          {
            optional: !required.has(name),
            type: schemaPropertyToTypeScript(property, description),
          },
        ];
      }),
    );
  }

  return contract;
};

const getReferencedInterfaceNames = (typeNode: ts.TypeNode): string[] => {
  const references = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      references.add(node.typeName.text);
    }
    ts.forEachChild(node, visit);
  };

  visit(typeNode);
  return [...references];
};

const getFrontendContract = (): ContractGraph => {
  const contractPath = resolve(process.cwd(), '../frontend/src/data-contracts/backend/data-contracts.ts');
  const sourceFile = ts.createSourceFile(contractPath, readFileSync(contractPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = new Map<string, ts.InterfaceDeclaration>();

  sourceFile.statements.forEach(statement => {
    if (ts.isInterfaceDeclaration(statement)) declarations.set(statement.name.text, statement);
  });

  const contract: ContractGraph = {};
  const pendingDeclarations = ['StakeholderDTO'];
  const visitedDeclarations = new Set<string>();

  while (pendingDeclarations.length > 0) {
    const declarationName = pendingDeclarations.shift();
    if (!declarationName || visitedDeclarations.has(declarationName)) continue;
    visitedDeclarations.add(declarationName);

    const declaration = declarations.get(declarationName);
    if (!declaration) throw new Error(`${declarationName} saknas i det genererade frontendkontraktet ${contractPath}`);

    contract[declarationName] = Object.fromEntries(
      declaration.members.map(member => {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name) || !member.type) {
          throw new Error(`${declarationName} innehåller en medlem som driftkontrollen inte kan tolka`);
        }

        getReferencedInterfaceNames(member.type).forEach(reference => {
          if (declarations.has(reference) && !visitedDeclarations.has(reference)) pendingDeclarations.push(reference);
        });

        return [
          member.name.text,
          {
            optional: member.questionToken !== undefined,
            type: member.type.getText(sourceFile),
          },
        ];
      }),
    );
  }

  return contract;
};

const getMutationRequestBodySchema = (spec: unknown, path: string): Record<string, unknown> => {
  const document = requireRecord(spec, 'OpenAPI-dokumentet');
  const paths = requireRecord(document.paths, 'OpenAPI.paths');
  const pathItem = requireRecord(paths[path], `OpenAPI.paths.${path}`);
  const operation = requireRecord(pathItem.patch, `OpenAPI.paths.${path}.patch`);
  const requestBody = requireRecord(operation.requestBody, `OpenAPI.paths.${path}.patch.requestBody`);
  const content = requireRecord(requestBody.content, `OpenAPI.paths.${path}.patch.requestBody.content`);
  const applicationJson = requireRecord(content['application/json'], `OpenAPI.paths.${path}.patch.requestBody.content.application/json`);
  return requireRecord(applicationJson.schema, `OpenAPI.paths.${path}.patch.requestBody.content.application/json.schema`);
};

describe('stakeholder contract drift', () => {
  it('keeps every transitively referenced frontend contract aligned with the backend OpenAPI schema', () => {
    const schemas = getOpenApiSchemas();
    expect(getFrontendContract()).toEqual(getBackendContract(schemas));
  });

  it('publishes the concrete mutation request schema for both PATCH routes', () => {
    const schemas = getOpenApiSchemas();
    const spec = routingControllersToSpec(
      getMetadataArgsStorage(),
      {
        routePrefix: '/api',
        controllers: [SupportManagementController],
      },
      {
        components: { schemas },
        info: { title: 'Stakeholder contract test', version: '1.0.0' },
      },
    );
    const expectedReference = { $ref: '#/components/schemas/ErrandMutationRequestDTO' };

    expect(getMutationRequestBodySchema(spec, '/api/supportmanagement/errand/save')).toEqual(expectedReference);
    expect(getMutationRequestBodySchema(spec, '/api/supportmanagement/errand/{id}')).toEqual(expectedReference);

    const mutationSchema = requireRecord(schemas.ErrandMutationRequestDTO, 'OpenAPI-schemat ErrandMutationRequestDTO');
    const mutationProperties = requireRecord(mutationSchema.properties, 'ErrandMutationRequestDTO.properties');
    expect(mutationProperties).toHaveProperty('stakeholders');
    expect(mutationProperties).toHaveProperty('activeNotifications');
  });
});
