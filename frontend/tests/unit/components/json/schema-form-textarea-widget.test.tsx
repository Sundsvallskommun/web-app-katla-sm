import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    description: { type: 'string', title: 'Beskrivning' },
    actions: { type: 'string', title: 'Åtgärder' },
  },
};

function renderTextareas(initialHeightRem?: unknown) {
  render(
    <SchemaForm
      schemaId="textarea-height:1"
      schema={schema}
      uiSchema={{
        description: { 'ui:widget': 'textarea', 'ui:options': { initialHeightRem } },
        actions: { 'ui:widget': 'textarea' },
      }}
      hideSubmitButton
    />
  );

  return screen.getByRole('textbox', { name: 'Beskrivning' });
}

describe('SchemaForm textarea height', () => {
  it.each([24, 17.5])('uses %s rem from the UI schema for the configured field only', (height) => {
    const description = renderTextareas(height);

    expect(description).toHaveStyle({ height: `${height}rem` });
    expect(description).toHaveClass('min-h-[9.6rem]', 'max-h-[60rem]');
    const actions = screen.getByRole('textbox', { name: 'Åtgärder' });
    expect(actions).not.toHaveAttribute('style');
    expect(actions).toHaveClass('h-[9.6rem]', 'min-h-[9.6rem]', 'max-h-[60rem]');
  });

  it.each([undefined, null, '24rem', -1, 0, Number.NaN, Number.POSITIVE_INFINITY])(
    'keeps the default height for missing or invalid configuration (%s)',
    (height) => {
      const description = renderTextareas(height);

      expect(description).not.toHaveAttribute('style');
      expect(description).toHaveClass('h-[9.6rem]', 'min-h-[9.6rem]', 'max-h-[60rem]');
    }
  );
});
