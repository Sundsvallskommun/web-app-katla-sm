import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SchemaController } from '@/controllers/schema.controller';
import { HttpException } from '@/exceptions/HttpException';
import { SchemaResponseDTO } from '@/responses/schema.response';
import ApiService from '@/services/api.service';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', {
      configurable: true,
      value: {
        username: 'test-user',
        name: 'Test User',
        givenName: 'Test',
        surname: 'User',
      },
    });
    next();
  },
}));

const app = new App([SchemaController]).getServer();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JSON schema adapter contracts', () => {
  it('returns the immutable requested ID and typed schema response for an exact version', async () => {
    const getSpy = vi
      .spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'schema-v1', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: { 'ui:order': ['name'] } }, message: 'success' });

    const response = await request(app).get('/api/schemas/schema-v1').expect(200);

    expect(response.body).toEqual({
      schema: { type: 'object' },
      uiSchema: { 'ui:order': ['name'] },
      schemaId: 'schema-v1',
    });
    expect(getSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ url: '2281/schemas/schema-v1' }));
  });

  it('fails closed when the exact endpoint returns a different schema ID', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { id: 'different-id', value: { type: 'object' } },
      message: 'success',
    });

    const response = await request(app).get('/api/schemas/schema-v1').expect(502);

    expect(response.body).toEqual({ message: 'Invalid JSON schema response: schema id does not match request' });
  });

  it('fails closed when the exact endpoint omits its schema ID', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { value: { type: 'object' } },
      message: 'success',
    });

    const response = await request(app).get('/api/schemas/schema-v1').expect(502);

    expect(response.body).toEqual({ message: 'Invalid JSON schema response: missing schema id' });
  });

  it('returns the upstream immutable ID for a latest schema and uses it for UI schema lookup', async () => {
    const getSpy = vi
      .spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'latest-schema-v2', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: {} }, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(200);

    expect(response.body).toEqual({ schema: { type: 'object' }, uiSchema: {}, schemaId: 'latest-schema-v2' });
    expect(getSpy.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ url: '2281/schemas/latest-schema-v2/ui-schema' }));
  });

  it.each([
    [{ value: { type: 'object' } }, 'Invalid JSON schema response: missing schema id'],
    [{ id: 'schema-v1' }, 'Invalid JSON schema response: missing schema definition'],
    [{ id: 'schema-v1', value: [] }, 'Invalid JSON schema response: missing schema definition'],
    [undefined, 'Invalid JSON schema response: missing schema definition'],
  ])('fails closed when latest schema payload is malformed', async (schema, message) => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: schema, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(502);

    expect(response.body).toEqual({ message });
  });

  it('preserves typed upstream schema errors', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    const response = await request(app).get('/api/schemas/schema-v1').expect(404);

    expect(response.body).toEqual({ message: 'Not found' });
  });

  it('treats a missing or malformed UI schema as optional without hiding the JSON schema', async () => {
    vi.spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: { id: 'schema-v1', value: { type: 'object' } }, message: 'success' })
      .mockResolvedValueOnce({ data: { value: [] }, message: 'success' });

    const response = await request(app).get('/api/schemas/latest/schema-name').expect(200);

    expect(response.body).toEqual({ schema: { type: 'object' }, uiSchema: {}, schemaId: 'schema-v1' });
  });

  describe('language', () => {
    const localizedUiSchema = {
      'ui:title': 'Plats och händelseförlopp',
      'x-i18n': { en: { 'ui:title': 'Location and sequence of events' } },
      eventTime: {
        'ui:widget': 'time',
        'ui:title': 'Tid',
        'x-i18n': { en: { 'ui:title': 'Time' } },
      },
    };

    const mockUpstream = () =>
      vi
        .spyOn(ApiService.prototype, 'get')
        .mockResolvedValueOnce({
          data: { id: 'schema-v1', value: { type: 'object', title: 'Plats och händelseförlopp' } },
          message: 'success',
        })
        .mockResolvedValueOnce({ data: { value: localizedUiSchema }, message: 'success' });

    it('serves the requested language and never exposes the translation block', async () => {
      mockUpstream();

      const response = await request(app).get('/api/schemas/schema-v1').set('Accept-Language', 'en').expect(200);
      const body = response.body as SchemaResponseDTO;

      expect(body.uiSchema).toEqual({
        'ui:title': 'Location and sequence of events',
        eventTime: { 'ui:widget': 'time', 'ui:title': 'Time' },
      });
      // Rubriken namnger formuläret i felsammanfattningen och ligger i JSON-schemat,
      // som bara kan ändras med en ny version — den hämtas därför ur ui-schemats rot.
      expect(body.schema).toEqual({ type: 'object', title: 'Location and sequence of events' });
      expect(JSON.stringify(body)).not.toContain('x-i18n');
    });

    it('falls back to Swedish when no language is requested', async () => {
      mockUpstream();

      const response = await request(app).get('/api/schemas/schema-v1').expect(200);
      const body = response.body as SchemaResponseDTO;

      expect(body.uiSchema).toEqual({
        'ui:title': 'Plats och händelseförlopp',
        eventTime: { 'ui:widget': 'time', 'ui:title': 'Tid' },
      });
      expect(body.schema).toEqual({ type: 'object', title: 'Plats och händelseförlopp' });
      expect(JSON.stringify(body)).not.toContain('x-i18n');
    });

    /**
     * Avvikelseformuläret hämtas från API:t igen, så inget schema hålls lokalt just nu och de
     * här kontrollerna har inget att beskriva. De är pausade i stället för borttagna: filerna
     * under src/local-schemas/ är kvar, och testerna gäller igen så snart ett schema läggs
     * tillbaka i listan i local-schemas.ts.
     */
    describe.skip('locally held schema', () => {
      const LOCAL_SCHEMA_NAME = 'avvikelse-plats-handelse';
      const LOCAL_SCHEMA_ID = '2281_avvikelse-plats-handelse_1.3';

      it('serves the local schema by name without calling the API', async () => {
        const getSpy = vi.spyOn(ApiService.prototype, 'get');

        const response = await request(app).get(`/api/schemas/latest/${LOCAL_SCHEMA_NAME}`).expect(200);
        const body = response.body as SchemaResponseDTO;
        const sections = body.uiSchema['ui:sections'] as { title: string }[];

        expect(getSpy).not.toHaveBeenCalled();
        expect(body.schemaId).toBe(LOCAL_SCHEMA_ID);
        expect(sections.map(section => section.title)).toEqual(['Plats', 'Tidpunkter', 'Beskrivning av händelse']);
        expect(JSON.stringify(body)).not.toContain('x-i18n');
      });

      it('serves the local schema by its pinned ID, so saved errands keep rendering', async () => {
        const getSpy = vi.spyOn(ApiService.prototype, 'get');

        const response = await request(app).get(`/api/schemas/${LOCAL_SCHEMA_ID}`).expect(200);
        const body = response.body as SchemaResponseDTO;

        expect(getSpy).not.toHaveBeenCalled();
        expect(body.schemaId).toBe(LOCAL_SCHEMA_ID);
      });

      /**
       * Hjälptexterna i beskrivningsavsnittet ska stå mellan rubriken och fältet. FieldTemplate
       * lägger dem under fältet så snart descriptionBelow är satt, så frånvaron är det som styr.
       */
      it('keeps the description fields titled and described above the input', async () => {
        const response = await request(app).get(`/api/schemas/latest/${LOCAL_SCHEMA_NAME}`).expect(200);
        const uiSchema = (response.body as SchemaResponseDTO).uiSchema;

        const described = ['eventDescription', 'actionsTaken', 'suggestedActions'] as const;
        const titles = described.map(field => (uiSchema[field] as Record<string, unknown>)['ui:title']);
        expect(titles).toEqual(['Händelse', 'Åtgärder som vidtogs direkt', 'Förslag på förbättringar']);

        for (const field of described) {
          const fieldUiSchema = uiSchema[field] as Record<string, unknown>;
          expect(fieldUiSchema['ui:description']).toEqual(expect.stringContaining('Beskriv'));
          expect(fieldUiSchema['ui:options']).toBeUndefined();
        }
      });

      it('translates the local schema like any other', async () => {
        const response = await request(app).get(`/api/schemas/latest/${LOCAL_SCHEMA_NAME}`).set('Accept-Language', 'en').expect(200);
        const body = response.body as SchemaResponseDTO;
        const sections = body.uiSchema['ui:sections'] as { title: string }[];

        expect(sections.map(section => section.title)).toEqual(['Location', 'Times', 'Description of the event']);
        expect(body.schema.title).toBe('Location and sequence of events');
      });
    });

    it('applies the same resolution to the latest-version route', async () => {
      mockUpstream();

      const response = await request(app).get('/api/schemas/latest/schema-name').set('Accept-Language', 'en-GB,en;q=0.9').expect(200);
      const body = response.body as SchemaResponseDTO;
      const eventTime = body.uiSchema.eventTime as Record<string, unknown>;

      expect(eventTime['ui:title']).toBe('Time');
      expect(body.schemaId).toBe('schema-v1');
    });
  });
});
