const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getKatlaDefinition, resolveKatlaDefinition } = require('../dist');
const { definitionRevision } = require('../dist/server');

const minimal = {
  id: 'equipment',
  applicationName: 'Equipment',
  flow: 'schema',
  forms: [{ schemaName: 'equipment-fields' }],
};

test('a new schema Katla resolves documented defaults without avvikelse data', () => {
  const definition = resolveKatlaDefinition(minimal);
  assert.equal(definition.flow, 'schema');
  assert.equal(definition.features.draftEnabled, true);
  assert.equal(definition.features.otherPartiesDisclosure, false);
  assert.deepEqual(definition.errandDefaults, {
    title: 'Ärende',
    priority: 'MEDIUM',
    channel: 'ESERVICE',
    resolution: 'INFORMED',
  });
  assert.ok(Object.isFrozen(definition.forms));
});

test('invalid configuration fails with actionable context', () => {
  for (const [change, error] of [
    [{ id: '../unsafe' }, /definition.id/],
    [{ flow: 'plugin' }, /flow/],
    [{ forms: [] }, /forms/],
    [{ forms: [{ schemaName: 'x' }, { schemaName: 'x' }] }, /duplicate/],
    [{ features: { draftEnabled: 'false' } }, /draftEnabled/],
    [{ features: { draftEnabled: null } }, /draftEnabled/],
    [{ features: { draftsEnabled: true } }, /draftsEnabled is unknown/],
    [{ features: { otherPartiesDisclosure: true } }, /requires the avvikelse/],
    [{ errandDefaults: { priority: 'URGENT' } }, /priority/],
    [{ namespace: 'must-stay-on-server' }, /namespace is unknown/],
  ])
    assert.throws(() => resolveKatlaDefinition({ ...minimal, ...change }), error);
});

test('unknown and test-only definitions never become an implicit production fallback', () => {
  assert.throws(() => getKatlaDefinition('unknown'), /Unknown Katla/);
  assert.throws(() => getKatlaDefinition('schema-test'), /test definition/);
  assert.throws(() => getKatlaDefinition('avvikelse-test'), /test definition/);
  assert.equal(getKatlaDefinition('schema-test', { allowTestDefinitions: true }).flow, 'schema');
});

test('existing avvikelse product choices and errand defaults remain explicit', () => {
  const definition = getKatlaDefinition('avvikelse');
  assert.equal(definition.features.draftEnabled, false);
  assert.equal(definition.features.reducedStakeholderInfo, true);
  assert.equal(definition.features.otherPartiesDisclosure, false);
  assert.equal(definition.errandDefaults.title, 'Empty errand');
  assert.deepEqual(definition.forms, [{ schemaName: 'avvikelse-plats-handelse' }]);
});

test('the revision covers effective settings and is stable across input ordering and explicit defaults', () => {
  const definition = resolveKatlaDefinition(minimal);
  const equivalent = resolveKatlaDefinition({
    ...minimal,
    features: definition.features,
    testOnly: false,
  });
  assert.match(definitionRevision(definition), /^[a-f0-9]{64}$/);
  assert.equal(definitionRevision(definition), definitionRevision(equivalent));
  assert.notEqual(
    definitionRevision(definition),
    definitionRevision(resolveKatlaDefinition({ ...minimal, features: { draftEnabled: false } })),
  );
});
