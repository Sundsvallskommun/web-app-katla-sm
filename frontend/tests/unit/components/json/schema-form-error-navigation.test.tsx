import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { act, render, screen } from '@testing-library/react';
import { focusFirstInvalidField, INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const ERROR_NAVIGATION_SCHEMA_ID = 'error-navigation-schema:1';

const schema: RJSFSchema = {
  type: 'object',
  required: ['eventDate', 'description'],
  properties: {
    eventDate: { type: 'string', title: 'Datum för händelsen' },
    description: { type: 'string', title: 'Beskrivning' },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  'ui:sections': [
    { id: 'event', title: 'Om händelsen', fields: ['eventDate'] },
    { id: 'details', title: 'Beskrivning', fields: ['description'] },
  ],
};

function ErrorNavigationForm({
  showValidation,
  formData,
}: {
  showValidation?: boolean;
  formData?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm
        schemaId={ERROR_NAVIGATION_SCHEMA_ID}
        schema={schema}
        uiSchema={uiSchema}
        hideSubmitButton
        showValidation={showValidation}
        formData={formData}
      />
    </FormProvider>
  );
}

describe('felnavigering i schemaformuläret', () => {
  it('håller avsnitten omärkta tills valideringen är igång', () => {
    render(<ErrorNavigationForm />);

    expect(document.querySelector(`[${INVALID_FIELD_ATTRIBUTE}]`)).not.toBeInTheDocument();
  });

  it('flyttar fokus till första fältet som saknas', () => {
    render(<ErrorNavigationForm showValidation />);

    const dateInput = screen.getByRole('textbox', { name: /Datum för händelsen/ });
    const markedFields = document.querySelectorAll(`[${INVALID_FIELD_ATTRIBUTE}]`);
    expect(markedFields).toHaveLength(2);
    expect(markedFields[0].getAttribute(INVALID_FIELD_ATTRIBUTE)).toBe('root_eventDate');

    let navigated = false;
    act(() => {
      navigated = focusFirstInvalidField();
    });

    expect(navigated).toBe(true);
    expect(dateInput).toHaveFocus();
  });
});
