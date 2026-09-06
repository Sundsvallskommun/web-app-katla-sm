import SchemaForm from '@components/json/schema/schema-form.component';
import type { LabelDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useMetadataStore } from 'src/stores/metadata-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const employmentsMock = vi.hoisted(() => vi.fn());

vi.mock('@services/employee-service/employee-service', () => ({
  getUserEmployments: employmentsMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** Platsvalet måste peka på en nod som finns i strukturen — den styr behörigheten till ärendet. */
const placeLabelStructure: LabelDTO[] = [
  {
    id: 'platsstruktur',
    classification: 'PLACE',
    displayName: 'Platsstruktur',
    resourceName: 'PLATSSTRUKTUR',
    resourcePath: 'PLATSSTRUKTUR',
    labels: [
      {
        id: 'vuxenutbildningen',
        classification: 'PLACE',
        displayName: 'IAF Vuxenutbildningen',
        resourceName: 'VUXENUTBILDNINGEN',
        resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN',
        labels: [
          {
            id: 'sfi',
            classification: 'PLACE',
            displayName: 'IAF VUX SFI SO och Grl',
            resourceName: 'SFI',
            resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI',
            labels: [
              {
                id: 'egen',
                classification: 'PLACE',
                displayName: 'IAF VUX SFI egen extern och SO',
                resourceName: 'EGEN',
                resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN',
                labels: [
                  {
                    id: 'utan-avdelning',
                    classification: 'PLACE',
                    displayName: 'Anläggning utan avdelning',
                    resourceName: 'UTAN_AVDELNING',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/UTAN_AVDELNING',
                    labels: [],
                  },
                  {
                    id: 'annan-anlaggning',
                    classification: 'PLACE',
                    displayName: 'Annan anläggning',
                    resourceName: 'ANNAN_ANLAGGNING',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/ANNAN_ANLAGGNING',
                    labels: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    facility: {
      type: 'object',
      title: 'Plats',
      properties: {
        orgId: { type: 'number' },
        orgName: { type: 'string' },
        parentOrgName: { type: 'string' },
      },
    },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  facility: { 'ui:field': 'FacilitySearchWidget' },
};

/** Enhetstesterna i projektet queryar data-cy direkt; testing-library är inte omkonfigurerad. */
const cy = (name: string) => document.querySelector(`[data-cy="${name}"]`);
const employment = (orgName: string, isMainEmployment = false): UserEmploymentDTO => ({
  orgId: 42,
  orgName,
  isMainEmployment,
});

const renderForm = (schemaId: string, formData?: Record<string, unknown>) =>
  render(<SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchema} formData={formData} hideSubmitButton />);

beforeEach(() => {
  useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });
});

afterEach(() => {
  employmentsMock.mockReset();
});

/**
 * Platsen väljs uttryckligen av användaren och förhandsfylls aldrig från anställningen. Anställningen slås fortfarande upp, eftersom platsvalet hämtar orgId
 * och enhetschef därifrån — den delen syns i selectPlace, inte här.
 */
describe('FacilitySearchWidget employment suggestion is disabled', () => {
  it('never renders the suggestion, even when the employment matches a place', async () => {
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true)]);

    renderForm('facility-suggestion-disabled:1');

    // Sökfältet är den observerbara readiness-gränsen; förslaget hann rendera innan det om det fanns.
    expect(await screen.findByRole('combobox', { name: /^facility_search.search_label/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(employmentsMock).toHaveBeenCalled();
    });

    expect(cy('facility-suggestion')).not.toBeInTheDocument();
    expect(cy('facility-card')).not.toBeInTheDocument();
  });
});

function EditableFacility() {
  const [data, setData] = useState<Record<string, unknown>>({});
  return (
    <>
      <SchemaForm
        schemaId="facility-employment-contract:1"
        schema={schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={setData}
        hideSubmitButton
      />
      <output aria-label="Platsdata">{JSON.stringify(data)}</output>
    </>
  );
}

describe('FacilitySearchWidget explicit selection', () => {
  it('adds the matching organisation and manager only when the user selects their employment place', async () => {
    const manager = { givenname: 'Kim', lastname: 'Chef', emailAddress: 'kim@example.com' };
    employmentsMock.mockResolvedValue([{ ...employment('Anläggning utan avdelning', true), manager }]);
    const user = userEvent.setup();
    render(<EditableFacility />);
    await waitFor(() => {
      expect(employmentsMock).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole('status', { name: 'Platsdata' })).toHaveTextContent('{}');
    await user.type(screen.getByRole('combobox', { name: /^facility_search.search_label/ }), 'utan avdelning');
    await user.click(await screen.findByRole('option', { name: 'Anläggning utan avdelning' }));
    expect(JSON.parse(screen.getByRole('status', { name: 'Platsdata' }).textContent ?? '{}')).toEqual({
      facility: {
        orgId: 42,
        orgName: 'Anläggning utan avdelning',
        parentOrgName: 'IAF VUX SFI egen extern och SO',
        manager,
      },
    });
    expect(screen.getByRole('button', { name: 'Anläggning utan avdelning' })).toBeInTheDocument();
  });

  it('does not carry the previous organisation or manager to another branch', async () => {
    employmentsMock.mockResolvedValue([
      { ...employment('Anläggning utan avdelning', true), manager: { givenname: 'Kim' } },
    ]);
    const user = userEvent.setup();
    render(<EditableFacility />);
    await waitFor(() => {
      expect(employmentsMock).toHaveBeenCalledOnce();
    });
    const input = screen.getByRole('combobox', { name: /^facility_search.search_label/ });
    await user.type(input, 'utan avdelning');
    await user.click(await screen.findByRole('option', { name: 'Anläggning utan avdelning' }));
    await user.click(screen.getByRole('button', { name: 'Anläggning utan avdelning' }));
    // Astryx fyller redigeringsfältet och flyttar fokus i nästa animation frame.
    await waitFor(() => {
      expect(input).toHaveValue('Anläggning utan avdelning');
    });
    await user.clear(input);
    await user.type(input, 'Annan anläggning');
    await user.click(await screen.findByRole('option', { name: 'Annan anläggning' }));
    expect(JSON.parse(screen.getByRole('status', { name: 'Platsdata' }).textContent ?? '{}')).toEqual({
      facility: {
        orgName: 'Annan anläggning',
        parentOrgName: 'IAF VUX SFI egen extern och SO',
      },
    });
  });
});
