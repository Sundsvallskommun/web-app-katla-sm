import { createHash } from 'node:crypto';
import { resolveKatlaDefinition, type KatlaDefinition } from './definition';

/** Hash resolved, canonical field order so input key order and omitted defaults do not change a release identity. */
export function definitionRevision(definition: KatlaDefinition): string {
  const normalized = resolveKatlaDefinition(definition);
  return createHash('sha256')
    .update(JSON.stringify({ ...normalized, testOnly: normalized.testOnly ?? false }))
    .digest('hex');
}
