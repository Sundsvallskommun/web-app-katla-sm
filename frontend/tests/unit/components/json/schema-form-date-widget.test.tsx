import { applyDateBounds } from '@components/json/schema/date-bounds';
import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    eventDate: { type: 'string', format: 'date', title: 'Upptäcktes' },
    followUpDate: { type: 'string', format: 'date', title: 'Uppföljning' },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  eventDate: {
    'ui:widget': 'date',
    'ui:options': { maxDate: 'today' },
  },
  followUpDate: {
    'ui:widget': 'date',
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe('SchemaForm date maximum', () => {
  it('materialiserar bara markerade datumfält till dagens datum', () => {
    const bounded = applyDateBounds(schema, uiSchema, '2026-09-02');

    expect(bounded.properties?.eventDate).toEqual(
      expect.objectContaining({ format: 'date', formatMaximum: '2026-09-02' })
    );
    expect(bounded.properties?.followUpDate).not.toHaveProperty('formatMaximum');
    expect(schema.properties?.eventDate).not.toHaveProperty('formatMaximum');
  });

  it('sätter max-attributet på datumkontrollen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00+02:00'));

    render(
      <SchemaForm
        schemaId="date-maximum-rendering:1"
        schema={schema}
        uiSchema={uiSchema}
        formData={{}}
        hideSubmitButton
      />
    );

    expect(screen.getByLabelText(/^Upptäcktes/)).toHaveAttribute('max', '2026-09-02');
    expect(screen.getByLabelText(/^Uppföljning/)).toHaveAttribute('max', '9999-12-31');
  });
});
