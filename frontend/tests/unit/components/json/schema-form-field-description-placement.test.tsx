import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { descriptionId } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    eventDescription: { type: 'string' },
  },
};

const uiSchemaWith = (options?: Record<string, unknown>): UiSchema<Record<string, unknown>> => ({
  eventDescription: {
    'ui:title': 'Händelseförlopp',
    'ui:description': 'Beskriv vad som hände steg för steg.',
    ...(options ? { 'ui:options': options } : {}),
  },
});

function DescriptionForm({ schemaId, options }: { schemaId: string; options?: Record<string, unknown> }) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchemaWith(options)} hideSubmitButton />
    </FormProvider>
  );
}

/** true när `first` står före `second` i dokumentordning. */
const comesBefore = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('SchemaForm field description placement', () => {
  it('places the description between the label and the field', () => {
    render(<DescriptionForm schemaId="description-above:1" />);

    const input = screen.getByRole('textbox', { name: /Händelseförlopp/ });
    const label = document.querySelector(`label[for="${input.id}"]`);
    const description = document.getElementById(descriptionId(input.id));

    if (!label || !description) throw new Error('Saknar etikett eller beskrivning');
    expect(description).toHaveTextContent('Beskriv vad som hände steg för steg.');
    expect(comesBefore(label, description)).toBe(true);
    expect(comesBefore(description, input)).toBe(true);
  });

  it('still honours descriptionBelow for fields that ask for it', () => {
    render(<DescriptionForm schemaId="description-below:1" options={{ descriptionBelow: true }} />);

    const input = screen.getByRole('textbox', { name: /Händelseförlopp/ });
    const description = document.getElementById(descriptionId(input.id));

    if (!description) throw new Error('Saknar beskrivning');
    expect(comesBefore(input, description)).toBe(true);
  });
});
