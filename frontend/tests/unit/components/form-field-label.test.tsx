import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema } from '@rjsf/utils';
import { FormControl, Input } from '@sk-web-gui/react';
import { act, render, screen, within } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import formsEn from '../../../locales/en/forms.json';
import formsSv from '../../../locales/sv/forms.json';

const i18n = createInstance();

beforeEach(async () => {
  await i18n.init({ lng: 'sv', resources: { sv: { forms: formsSv }, en: { forms: formsEn } } });
});

describe('application field labels', () => {
  it('writes both requirements in the label and preserves the required state without a star', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <FormControl required>
          <FormFieldLabel>Namn</FormFieldLabel>
          <Input />
        </FormControl>
        <FormControl>
          <FormFieldLabel>E-post</FormFieldLabel>
          <Input />
        </FormControl>
      </I18nextProvider>
    );

    expect(screen.getByRole('textbox', { name: 'Namn (obligatoriskt)' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'E-post (frivilligt)' })).not.toBeRequired();
    expect(container.querySelector('.sk-form-required-indicator')).not.toBeInTheDocument();
    expect(screen.getAllByText('(obligatoriskt)')).toHaveLength(1);
    expect(screen.getAllByText('(frivilligt)')).toHaveLength(1);
  });

  it('updates the suffix when the language changes', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FormControl required>
          <FormFieldLabel>Namn</FormFieldLabel>
          <Input />
        </FormControl>
        <FormControl>
          <FormFieldLabel>E-post</FormFieldLabel>
          <Input />
        </FormControl>
      </I18nextProvider>
    );

    expect(screen.getByRole('textbox', { name: 'E-post (frivilligt)' })).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.getByRole('textbox', { name: 'E-post (optional)' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Namn (required)' })).toBeRequired();
  });

  it('marks schema fields once, including radio groups and checkboxes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['event'],
      properties: {
        event: { type: 'string', title: 'Händelse' },
        actions: { type: 'string', title: 'Åtgärder' },
        category: { type: 'string', title: 'Kategori', enum: ['A', 'B'] },
        followUp: { type: 'string', title: 'Uppföljning', enum: ['Ja', 'Nej'] },
        contact: { type: 'boolean', title: 'Kontakta mig' },
      },
    };

    render(
      <I18nextProvider i18n={i18n}>
        <SchemaForm
          schemaId="optional-label-fields:1"
          schema={schema}
          uiSchema={{
            actions: { 'ui:widget': 'textarea' },
            category: { 'ui:widget': 'select' },
            followUp: { 'ui:widget': 'radio' },
          }}
          hideSubmitButton
        />
      </I18nextProvider>
    );

    expect(screen.getByRole('textbox', { name: 'Händelse (obligatoriskt)' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Åtgärder (frivilligt)' })).not.toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Kategori (frivilligt)' })).not.toBeRequired();
    expect(screen.getByRole('checkbox', { name: 'Kontakta mig (frivilligt)' })).not.toBeRequired();
    const group = screen.getByRole('group', { name: 'Uppföljning (frivilligt)' });
    expect(within(group).getByRole('radio', { name: 'Ja' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: 'Nej' })).toBeInTheDocument();
    expect(screen.getAllByText('(frivilligt)')).toHaveLength(4);
  });

  it('updates the requirement text when the schema requirement changes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        details: { type: 'string', title: 'Uppgifter' },
      },
    };

    const form = (required: boolean) => (
      <I18nextProvider i18n={i18n}>
        <SchemaForm
          schemaId={`optional-label-required:${required}`}
          schema={{ ...schema, required: required ? ['details'] : [] }}
          hideSubmitButton
        />
      </I18nextProvider>
    );
    const { container, rerender } = render(form(false));

    expect(screen.getByRole('textbox', { name: 'Uppgifter (frivilligt)' })).not.toBeRequired();
    rerender(form(true));
    expect(screen.getByRole('textbox', { name: 'Uppgifter (obligatoriskt)' })).toBeRequired();
    expect(screen.queryByText('(frivilligt)')).not.toBeInTheDocument();

    rerender(form(false));
    expect(screen.getByRole('textbox', { name: 'Uppgifter (frivilligt)' })).not.toBeRequired();
    expect(container.querySelector('.sk-form-required-indicator')).not.toBeInTheDocument();
  });
});
