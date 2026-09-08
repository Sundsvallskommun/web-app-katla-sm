import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function ValueContractForm({
  schema,
  uiSchema,
  initialData,
}: {
  schema: RJSFSchema;
  uiSchema?: UiSchema<Record<string, unknown>>;
  initialData: Record<string, unknown>;
}) {
  const [data, setData] = useState(initialData);

  return (
    <>
      <SchemaForm
        schemaId="schema-widget-value-contract:1"
        schema={schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={setData}
        hideSubmitButton
      />
      <output aria-label="Formulärdata">{JSON.stringify(data)}</output>
    </>
  );
}

describe('SchemaForm control value contracts', () => {
  it('submits schema data through the submit control', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SchemaForm
        schemaId="schema-submit-contract:1"
        schema={{
          type: 'object',
          required: ['summary'],
          properties: { summary: { type: 'string', title: 'Rubrik' } },
        }}
        formData={{ summary: 'Sparad rubrik' }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'submit_button_default' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ summary: 'Sparad rubrik' }, expect.anything());
  });

  it('clears text and textarea values to missing schema values while retaining stable label targets', async () => {
    const user = userEvent.setup();
    render(
      <ValueContractForm
        schema={{
          type: 'object',
          properties: {
            summary: { type: 'string', title: 'Rubrik' },
            details: { type: 'string', title: 'Beskrivning' },
          },
        }}
        uiSchema={{ details: { 'ui:widget': 'textarea' } }}
        initialData={{ summary: 'Rubrik', details: 'Beskrivning' }}
      />
    );

    const summary = screen.getByRole('textbox', { name: /^Rubrik/ });
    const details = screen.getByRole('textbox', { name: /^Beskrivning/ });
    expect(summary).toHaveAttribute('id', 'root_summary');
    expect(details).toHaveAttribute('id', 'root_details');
    await user.clear(summary);
    await user.clear(details);

    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent('{}');
    await user.click(screen.getByText('Rubrik', { selector: 'label' }));
    expect(summary).toHaveFocus();
  });

  it('retains select strings, radio enum types and boolean checkbox values', async () => {
    const user = userEvent.setup();
    render(
      <ValueContractForm
        schema={{
          type: 'object',
          properties: {
            category: { type: 'string', title: 'Kategori', enum: ['A', 'B'] },
            severity: { type: 'number', title: 'Omfattning', enum: [1, 2] },
            contact: { type: 'boolean', title: 'Kontakta mig' },
          },
        }}
        uiSchema={{
          category: { 'ui:widget': 'select' },
          severity: { 'ui:widget': 'radio', 'ui:enumNames': ['Liten', 'Stor'] },
        }}
        initialData={{ category: 'A', severity: 1, contact: false }}
      />
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /^Kategori/ }), 'B');
    await user.click(screen.getByRole('radio', { name: 'Stor' }));
    await user.click(screen.getByRole('checkbox', { name: /^Kontakta mig/ }));

    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent(
      '{"category":"B","severity":2,"contact":true}'
    );
    expect(screen.getByRole('radio', { name: 'Stor' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^Kontakta mig/ })).toBeChecked();
  });

  it('keeps readonly text focusable without allowing edits and disables disabled text', async () => {
    const user = userEvent.setup();
    render(
      <ValueContractForm
        schema={{
          type: 'object',
          properties: {
            summary: { type: 'string', title: 'Rubrik', readOnly: true },
            details: { type: 'string', title: 'Beskrivning' },
          },
        }}
        uiSchema={{ details: { 'ui:disabled': true } }}
        initialData={{ summary: 'Sparad rubrik', details: 'Sparad beskrivning' }}
      />
    );

    const summary = screen.getByRole('textbox', { name: /^Rubrik/ });
    const details = screen.getByRole('textbox', { name: /^Beskrivning/ });
    expect(summary).toHaveAttribute('readonly');
    expect(summary).not.toBeDisabled();
    expect(details).toBeDisabled();
    await user.click(summary);
    expect(summary).toHaveFocus();
    await user.keyboard('Ny text');
    expect(summary).toHaveValue('Sparad rubrik');
  });
  it('searches a single enum and preserves multi-select string values through select and clear', async () => {
    const user = userEvent.setup();
    render(
      <ValueContractForm
        schema={{
          type: 'object',
          properties: {
            category: { type: 'string', title: 'Kategori', enum: ['Alpha', 'Beta'] },
            tags: {
              type: 'array',
              title: 'Etiketter',
              uniqueItems: true,
              items: { type: 'string', enum: ['Alpha', 'Beta'] },
            },
          },
        }}
        uiSchema={{ category: { 'ui:widget': 'combobox' }, tags: { 'ui:widget': 'combobox' } }}
        initialData={{ category: 'Alpha', tags: ['Alpha'] }}
      />
    );
    const category = screen.getByRole('button', { name: /^Kategori/ });
    await user.click(category);
    await user.type(screen.getByRole('combobox'), 'Beta');
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent('"category":"Beta"');
    expect(category).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /^Etiketter/ }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent('"tags":["Alpha","Beta"]');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /Clear all.*Etiketter|Clear Etiketter/ }));
    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent('"tags":[]');
  });

  it('keeps searchable selections disabled for readonly schema fields', async () => {
    const user = userEvent.setup();
    render(
      <ValueContractForm
        schema={{
          type: 'object',
          properties: {
            category: { type: 'string', title: 'Kategori', enum: ['Alpha', 'Beta'], readOnly: true },
          },
        }}
        uiSchema={{ category: { 'ui:widget': 'combobox' } }}
        initialData={{ category: 'Alpha' }}
      />
    );
    const category = screen.getByRole('button', { name: /^Kategori/ });
    expect(category).toBeDisabled();
    await user.click(category);
    expect(category).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status', { name: 'Formulärdata' })).toHaveTextContent('"category":"Alpha"');
  });
});
