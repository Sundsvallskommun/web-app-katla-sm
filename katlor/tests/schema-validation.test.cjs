const { test } = require('node:test');
const assert = require('node:assert/strict');
const Ajv2020 = require('ajv/dist/2020').default;
const { stripHtml, installHtmlLengthKeywords, createSchemaAjv } = require('../dist/schema-validation');

test('same rich text and entity length without browser DOMParser', () => {
  assert.equal(stripHtml('<p>&nbsp;Hej &amp; tack &#33;</p>'), 'Hej & tack !');
  assert.equal(stripHtml('<p><br></p>'), '');
  const ajv = new Ajv2020();
  installHtmlLengthKeywords(ajv);
  const validate = ajv.compile({ type: 'string', minLength: 3, maxLength: 3 });
  assert.equal(validate('<p>abc</p>'), true);
  assert.equal(validate('<p>a&amp;b</p>'), true);
  assert.equal(validate('<p>a</p>'), false);
  assert.equal(validate('<p>abcd</p>'), false);
});

test('date bounds preserve the source document and materialize the chosen business day', () => {
  const { applyDateBounds } = require('../dist/schema-validation');
  const schema = { type: 'object', properties: { occurred: { type: 'string', format: 'date' } } };
  const bounded = applyDateBounds(schema, { occurred: { 'ui:options': { maxDate: 'today' } } }, '2026-09-07');
  assert.equal(bounded.properties.occurred.formatMaximum, '2026-09-07');
  assert.equal(schema.properties.occurred.formatMaximum, undefined);
});

test('the onboarding check and runtime accept the same supported schema dialects and rich text rules', () => {
  for (const dialect of [
    undefined,
    'https://json-schema.org/draft/2020-12/schema',
    'https://json-schema.org/draft/2019-09/schema',
    'http://json-schema.org/draft-07/schema#',
  ]) {
    const validate = createSchemaAjv(dialect).compile({
      ...(dialect ? { $schema: dialect } : {}),
      type: 'string',
      minLength: 1,
    });
    assert.equal(validate('<p><br></p>'), false);
    assert.equal(validate('<p>Hej</p>'), true);
  }
  assert.throws(() => createSchemaAjv('unknown-dialect'), /SCHEMA_DIALECT_UNSUPPORTED/);
});
