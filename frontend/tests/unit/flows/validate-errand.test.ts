import { collectErrandFormDataErrors, schemaFieldPrefix } from '@components/json/utils/schema-utils';
import { getActiveWizardSteps } from '@components/wizard/wizard-steps';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { getKatlaDefinition, resolveKatlaDefinition } from '@katla/definitions';
import { createInstance } from 'i18next';
import { validateErrand } from 'src/flows/validate-errand';
import { afterEach, describe, expect, it, vi } from 'vitest';

const i18n = createInstance();
await i18n.init({ lng: 'sv', resources: {} });
const fetchUrl = (value: Parameters<typeof fetch>[0]) => (value instanceof Request ? value.url : value.toString());
const schemaKatla = getKatlaDefinition('schema-test', { allowTestDefinitions: true });
const avvikelse = getKatlaDefinition('avvikelse');
afterEach(() => vi.unstubAllGlobals());

function schemaResponse(id: string) {
  return new Response(
    JSON.stringify({
      schemaId: id,
      schema: {
        type: 'object',
        properties: { description: { type: 'string', minLength: 1 } },
        required: ['description'],
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

describe('Katla flow submission contract', () => {
  it('offers only reporter, case details and summary for a schema Katla', () => {
    expect(getActiveWizardSteps('ENSKILD_BRUKARE', schemaKatla).map((step) => step.id)).toEqual([
      'reporter',
      'details',
      'summary',
    ]);
    expect(getActiveWizardSteps('ENSKILD_BRUKARE', avvikelse).map((step) => step.id)).toContain('user');
  });

  it('submits schema data without requiring Avvikelse parameters, person or place', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(schemaResponse('standard-flow-v1')));
    const values: ErrandFormDTO = {
      errandFormData: [
        {
          schemaName: schemaKatla.forms[0].schemaName,
          schemaId: 'standard-flow-v1',
          data: JSON.stringify({ description: 'Beställning' }),
        },
      ],
    };
    await expect(validateErrand(values, schemaKatla, i18n.t, i18n.t, 'sv', 'INCOMPLETE', true)).resolves.toEqual([]);
    const errors = await validateErrand(values, avvikelse, i18n.t, i18n.t, 'sv', 'INCOMPLETE', true);
    expect(errors.map((error) => error.fieldId)).toEqual(
      expect.arrayContaining(['event-type', 'event-concerns', 'root_facilityInfo'])
    );
  });

  it('requires an explicitly promised colleague in either presentation', async () => {
    const values: ErrandFormDTO = { reportingForColleague: true, id: 'saved', errandFormData: [] };
    const errors = await validateErrand(values, schemaKatla, i18n.t, i18n.t, 'sv', 'NONE', true);
    expect(errors.map((error) => error.fieldId)).toContain('reporter-colleague');
  });

  it('preserves the saved schema identity when a definition switches schema names', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(schemaResponse('historical-v1'));
    vi.stubGlobal('fetch', fetchMock);
    const newerDefinition = resolveKatlaDefinition({ ...schemaKatla, forms: [{ schemaName: 'new-form' }] });
    const values: ErrandFormDTO = {
      id: 'saved',
      errandFormData: [
        { schemaName: 'old-form', schemaId: 'historical-v1', data: JSON.stringify({ description: 'Sparat utkast' }) },
      ],
    };
    await expect(validateErrand(values, newerDefinition, i18n.t, i18n.t, 'sv', 'NONE', true)).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/schemas/historical-v1'), expect.anything());
    expect(fetchMock.mock.calls.some(([url]) => fetchUrl(url).includes('latest'))).toBe(false);
  });

  it('gives equal field names in different forms distinct error targets', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockImplementation((url) => Promise.resolve(schemaResponse(fetchUrl(url).split('/').pop() ?? '')))
    );
    const entries = ['first', 'second'].map((schemaName) => ({
      schemaName,
      schemaId: `multi-${schemaName}`,
      data: '{}',
    }));
    const errors = await collectErrandFormDataErrors(entries, undefined, 'sv', ['first', 'second']);
    expect(errors.map((error) => error.fieldId)).toEqual(['form-first_description', 'form-second_description']);
    expect(schemaFieldPrefix('first', ['first', 'second'])).toBe('form-first');
  });
});
