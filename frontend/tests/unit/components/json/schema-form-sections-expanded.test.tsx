import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    description: { type: 'string', title: 'Beskrivning' },
  },
};

/**
 * defaultOpen och icon kommer från ui-scheman som skrevs när avsnitten gick att fälla
 * ihop och hade ikoner. Nycklarna ska ignoreras i stället för att dölja fält eller rita
 * ut en ikon, så båda ingår i testet.
 */
const uiSchemaWith = (section: { defaultOpen?: boolean; icon?: string }): UiSchema<Record<string, unknown>> => ({
  'ui:sections': [
    {
      id: 'event-information',
      title: 'Information om händelsen',
      fields: ['description'],
      ...section,
    },
  ],
});

function SectionForm({ schemaId, ...section }: { schemaId: string; defaultOpen?: boolean; icon?: string }) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchemaWith(section)} hideSubmitButton />
    </FormProvider>
  );
}

describe('SchemaForm sections', () => {
  it('shows the fields of a section', () => {
    render(<SectionForm schemaId="expanded-schema:1" />);

    expect(screen.getByRole('textbox', { name: /Beskrivning/ })).toBeVisible();
  });

  it('ignores a leftover defaultOpen:false instead of hiding the fields', () => {
    render(<SectionForm schemaId="legacy-closed-schema:1" defaultOpen={false} />);

    expect(screen.getByRole('textbox', { name: /Beskrivning/ })).toBeVisible();
  });

  it('renders the section heading without a collapse control', () => {
    render(<SectionForm schemaId="heading-schema:1" />);

    expect(screen.getByRole('heading', { name: 'Information om händelsen' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Information om händelsen/ })).not.toBeInTheDocument();
  });

  /**
   * Avdelaren skiljer ett avsnitt från nästa. Under det sista finns inget att skilja från,
   * och en avdelare där ser ut som en avklippt sida.
   */
  it('divides the sections from each other but leaves nothing hanging under the last one', () => {
    const multiSectionSchema: RJSFSchema = {
      type: 'object',
      properties: {
        description: { type: 'string', title: 'Beskrivning' },
        actions: { type: 'string', title: 'Åtgärder' },
      },
    };
    const multiSectionUiSchema: UiSchema<Record<string, unknown>> = {
      'ui:sections': [
        { id: 'first', title: 'Första', fields: ['description'] },
        { id: 'last', title: 'Sista', fields: ['actions'] },
      ],
    };

    function MultiSectionForm() {
      const methods = useForm({ defaultValues: { status: 'DRAFT' } });
      return (
        <FormProvider {...methods}>
          <SchemaForm
            schemaId="section-dividers:1"
            schema={multiSectionSchema}
            uiSchema={multiSectionUiSchema}
            hideSubmitButton
          />
        </FormProvider>
      );
    }

    const { container } = render(<MultiSectionForm />);

    expect(container.querySelectorAll('hr.sk-divider')).toHaveLength(1);
    const divider = container.querySelector('hr.sk-divider');
    const lastField = screen.getByRole('textbox', { name: /Åtgärder/ });
    if (!divider) throw new Error('Saknar avdelare');
    expect(Boolean(divider.compareDocumentPosition(lastField) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it('ignores a leftover icon instead of drawing one next to the heading', () => {
    const { container } = render(<SectionForm schemaId="legacy-icon-schema:1" icon="file-text" />);

    expect(screen.getByRole('heading', { name: 'Information om händelsen' })).toBeVisible();
    expect(container.querySelector('svg.lucide-file-text')).not.toBeInTheDocument();
  });
});
