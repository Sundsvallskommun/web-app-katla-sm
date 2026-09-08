import { ErrandFormDTO } from '@interfaces/errand-form';
import { resolveKatlaDefinition } from '@katla/definitions';
import { createInstance } from 'i18next';
import { initializeErrandFormData } from 'src/flows/errand-forms';
import { afterEach, describe, expect, it, vi } from 'vitest';

const i18n = createInstance();
await i18n.init({ lng: 'sv', resources: {} });
const definition = resolveKatlaDefinition({
  id: 'multiple-forms',
  applicationName: 'Flera formulär',
  flow: 'schema',
  forms: [{ schemaName: 'request' }, { schemaName: 'delivery' }],
});
afterEach(() => vi.unstubAllGlobals());

function schemas() {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
    const url = input instanceof Request ? input.url : input.toString();
    const name = url.split('/').pop();
    return Promise.resolve(new Response(JSON.stringify({ schemaId: `${name}-v1`, schema: { type: 'object' } })));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('first draft save locks all schema references', () => {
  it('initializes even unvisited forms before anything has been entered', async () => {
    schemas();
    await expect(initializeErrandFormData({}, definition, i18n.t, 'sv')).resolves.toEqual([
      { schemaName: 'request', schemaId: 'request-v1', data: '{}' },
      { schemaName: 'delivery', schemaId: 'delivery-v1', data: '{}' },
    ]);
  });

  it('keeps entered data and its version while adding the remaining form', async () => {
    schemas();
    const entered = { schemaName: 'request', schemaId: 'request-older', data: '{"description":"Bevara"}' };
    const values: ErrandFormDTO = { errandFormData: [entered] };
    await expect(initializeErrandFormData(values, definition, i18n.t, 'sv')).resolves.toEqual([
      entered,
      { schemaName: 'delivery', schemaId: 'delivery-v1', data: '{}' },
    ]);
    expect(values.errandFormData).toEqual([entered]);
  });

  it('preserves the complete saved membership after the definition changes', async () => {
    const fetchMock = schemas();
    const saved = [{ schemaName: 'historical-form', schemaId: 'historical-v1', data: '{}' }];
    await expect(
      initializeErrandFormData({ id: 'saved', errandFormData: saved }, definition, i18n.t, 'sv')
    ).resolves.toEqual(saved);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails if an existing entry has lost its immutable schema identity', async () => {
    const fetchMock = schemas();
    await expect(
      initializeErrandFormData({ errandFormData: [{ schemaName: 'request', data: '{}' }] }, definition, i18n.t, 'sv')
    ).rejects.toMatchObject({ code: 'missing-schema-id', schemaName: 'request' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
