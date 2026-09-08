import { avvikelse } from './avvikelse/definition';
import { avvikelseTest } from './avvikelse-test/definition';
import { resolveKatlaDefinition } from './definition';
import { schemaTest } from './schema-test/definition';
// katla:new imports

export * from './definition';

// Explicit registry: katla:new adds an import and a reference here.
export const katlaDefinitions = Object.freeze(
  [
    avvikelse,
    avvikelseTest,
    schemaTest,
    // katla:new registry
  ].map(resolveKatlaDefinition),
);

if (new Set(katlaDefinitions.map((definition) => definition.id)).size !== katlaDefinitions.length) {
  throw new Error('Katla definitions contain duplicate ids. Every id must be unique.');
}

export function getKatlaDefinition(id: string, options: { allowTestDefinitions?: boolean } = {}) {
  const definition = katlaDefinitions.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown Katla id "${id}". Register it in katlor/src/index.ts.`);
  if (definition.testOnly && !options.allowTestDefinitions) {
    throw new Error(`Katla "${id}" is a test definition. Explicit test mode is required.`);
  }
  return definition;
}
