import SchemaForm from '@components/json/schema/schema-form.component';
import type { LabelDTO } from '@data-contracts/backend/data-contracts';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { focusInvalidField, INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { useMetadataStore } from 'src/stores/metadata-store';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Platswidgeten bygger sökningen ur labelstrukturen och renderar bara en text utan den,
// så testet måste seeda en struktur för att nå fältet alls.
const placeLabelStructure: LabelDTO[] = [
  {
    id: 'platsstruktur',
    classification: 'PLACE',
    displayName: 'Platsstruktur',
    resourceName: 'PLATSSTRUKTUR',
    resourcePath: 'PLATSSTRUKTUR',
    labels: [
      {
        id: 'solhaga',
        classification: 'PLACE',
        displayName: 'Solhaga',
        resourceName: 'SOLHAGA',
        resourcePath: 'PLATSSTRUKTUR/SOLHAGA',
        labels: [],
      },
    ],
  },
];

// Samma form som det skarpa schemat: platsen är ett objekt vars valda enhet ligger i orgName.
// Utan kravet på orgName räknades ett tomt objekt som ifyllt, och platsen gick att hoppa över.
const schema: RJSFSchema = {
  type: 'object',
  required: ['facilityInfo'],
  properties: {
    facilityInfo: {
      type: 'object',
      required: ['orgName'],
      properties: { orgName: { type: 'string', minLength: 1 } },
    },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  facilityInfo: { 'ui:field': 'FacilitySearchWidget', 'ui:title': 'Enhet eller avdelning' },
};

const renderForm = () => {
  useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });

  return render(
    <SchemaForm
      schemaId="facility-validation:1"
      schema={schema}
      uiSchema={uiSchema}
      formData={{}}
      hideSubmitButton
      showValidation
    />
  );
};

describe('FacilitySearchWidget validation', () => {
  /**
   * Fältet renderas av ett eget ui:field och passerar därför inte FieldTemplate, som annars
   * skriver ut felmeddelandet. Utan det här visade platsen inget fel alls.
   */
  it('shows the validation message on the field itself', () => {
    renderForm();

    const field = document.querySelector(`[${INVALID_FIELD_ATTRIBUTE}="root_facilityInfo"]`);
    expect(field).toBeInTheDocument();
    expect(field).toHaveTextContent('validation:required');
  });

  /**
   * Felet namnger den nästlade egenskapen, men widgeten renderar hela objektet som en enda
   * kontroll. Felsammanfattningens länk måste ändå hitta fram.
   */
  it('is reachable from the nested property id the error carries', () => {
    renderForm();

    expect(focusInvalidField('root_facilityInfo_orgName')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'facility_search.search_label' })).toHaveFocus();
  });
});
