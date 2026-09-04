import { getFormSchemaValidator } from '@components/json/schema/form-schema-validator';
import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema } from '@rjsf/utils';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import schemaReference from '../../../../../backend/src/local-schemas/avvikelse-plats-handelse.schema.json';
import uiSchemaReference from '../../../../../backend/src/local-schemas/avvikelse-plats-handelse.ui-schema.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@services/employee-service/employee-service', () => ({
  getUserEmployments: () => Promise.resolve([]),
}));

const schema = schemaReference.value as RJSFSchema;
const uiSchema: Record<string, unknown> = uiSchemaReference.value;
const validator = getFormSchemaValidator(schemaReference.id);
const reportWithoutActions = {
  facilityInfo: { orgName: 'Testenhet' },
  eventDate: '2026-09-01',
  eventDescription: 'En beskrivning av händelsen.',
};

function EventForm({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });
  const [data, setData] = useState<Record<string, unknown>>(reportWithoutActions);

  return (
    <FormProvider {...methods}>
      <SchemaForm
        schemaId={schemaReference.id}
        schema={schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={setData}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
}

describe('Event description schema contract', () => {
  it('accepts a report without immediate actions', () => {
    expect(validator.validateFormData(reportWithoutActions, schema).errors).toEqual([]);
  });

  it('keeps the minimum length when immediate actions are provided', () => {
    const shortActions = { ...reportWithoutActions, actionsTaken: 'Kort' };
    expect(validator.validateFormData(shortActions, schema).errors).toEqual([
      expect.objectContaining({ name: 'minLength', property: '.actionsTaken' }),
    ]);

    const validActions = { ...reportWithoutActions, actionsTaken: 'Kontaktade ansvarig personal.' };
    expect(validator.validateFormData(validActions, schema).errors).toEqual([]);
  });

  it('still requires a description of the event', () => {
    const withoutDescription = { facilityInfo: reportWithoutActions.facilityInfo, eventDate: '2026-09-01' };
    expect(validator.validateFormData(withoutDescription, schema).errors).toEqual([
      expect.objectContaining({ name: 'required', property: 'eventDescription' }),
    ]);
  });

  it('starts the event field at 24 rem and allows submitting untouched or cleared actions', async () => {
    const onSubmit = vi.fn<(data: Record<string, unknown>) => void>();
    render(<EventForm onSubmit={onSubmit} />);

    const description = screen.getByRole('textbox', { name: /^Händelse/ });
    const actions = screen.getByRole('textbox', { name: /Åtgärder som vidtogs direkt/ });
    expect(description).toHaveStyle({ height: '24rem' });
    expect(description).toHaveAttribute('aria-required', 'true');
    expect(actions).toHaveAttribute('aria-required', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'submit_button_default' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0].actionsTaken).toBeUndefined();

    fireEvent.change(actions, { target: { value: 'Kontaktade ansvarig personal.' } });
    fireEvent.change(actions, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'submit_button_default' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });
    const clearedReport = onSubmit.mock.calls[1]?.[0];
    expect(clearedReport?.actionsTaken).toBeUndefined();
    expect(validator.validateFormData(clearedReport ?? {}, schema).errors).toEqual([]);
    expect(actions).toHaveAttribute('aria-invalid', 'false');
  });
});
