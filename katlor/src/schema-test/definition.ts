import type { KatlaDefinitionInput } from '../definition';

/** Explicit fixture, not a connected business application. No avvikelse vocabulary or rules. */
export const schemaTest = {
  id: 'schema-test',
  applicationName: 'Schema-Katla (test)',
  description: 'Test av det gemensamma schemaflödet.',
  flow: 'schema',
  forms: [{ schemaName: 'schema-test-arendeuppgifter' }],
  testOnly: true,
} satisfies KatlaDefinitionInput;
