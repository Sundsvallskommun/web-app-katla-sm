import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * Obligatoriska fält får inte se felmarkerade ut innan användaren rört dem. Designsystemet
 * ritar röd ram på både `[aria-invalid="true"]` och webbläsarens `:invalid`, och ett tomt
 * `<input required>` är `:invalid` direkt vid rendering — även med noHtml5Validate på formuläret.
 * Obligatoriet uttrycks därför med aria-required, precis som texteditor-widgeten redan gör.
 */
const schema: RJSFSchema = {
  type: 'object',
  required: ['eventDate', 'eventName'],
  properties: {
    eventDate: { type: 'string', format: 'date' },
    eventTime: { type: 'string', format: 'time' },
    eventName: { type: 'string' },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  eventDate: { 'ui:widget': 'date', 'ui:title': 'När upptäcktes händelsen?' },
  eventTime: { 'ui:widget': 'time', 'ui:title': 'Tid' },
  eventName: { 'ui:title': 'Rubrik' },
};

function UntouchedForm({ schemaId }: { schemaId: string }) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchema} hideSubmitButton />
    </FormProvider>
  );
}

describe('SchemaForm required fields before validation starts', () => {
  it('marks required fields with aria-required, never the native required attribute', () => {
    const { container } = render(<UntouchedForm schemaId="untouched-required:1" />);

    const dateInput = container.querySelector('#root_eventDate');
    const nameInput = container.querySelector('#root_eventName');
    if (!dateInput || !nameInput) throw new Error('Saknar fälten');

    expect(dateInput).toHaveAttribute('aria-required', 'true');
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    // Ett tomt `required`-fält är `:invalid` direkt, och designsystemet ritar det rött.
    expect(dateInput).not.toHaveAttribute('required');
    expect(nameInput).not.toHaveAttribute('required');
  });

  it('leaves every field unmarked as invalid while the form is untouched', () => {
    const { container } = render(<UntouchedForm schemaId="untouched-invalid:1" />);

    expect(container.querySelector('[aria-invalid="true"]')).not.toBeInTheDocument();
    expect(container.querySelector('.sk-form-error-message')).not.toBeInTheDocument();
  });
});
