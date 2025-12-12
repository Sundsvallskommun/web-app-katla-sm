import { mockErrand } from 'cypress/fixtures/mockErrand';
import { mockMetadata } from 'cypress/fixtures/mockMetadata';
import { mockReporterStakeholder } from 'cypress/fixtures/mockStakeholder';
import { addStakeholder } from 'cypress/utils/stakeholder';
import { useMetadataStore } from 'src/stores/metadata-store';

describe('Register new errand page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/employee/personal', mockReporterStakeholder).as('getReporterStakeholder');
    useMetadataStore.setState({ metadata: mockMetadata });

    cy.visit('/arende/registrera');
  });

  // TODO: Add more stakeholder for register draft errand and test errand details?
  it('Register draft errand', () => {
    cy.intercept('POST', '**/supportmanagement/errand/create', mockErrand).as('createDraftErrand');
    cy.intercept('GET', '**/supportmanagement/errand/**', mockErrand).as('getCreatedErrand');
    cy.get('main').should('be.visible');
    cy.get('[data-cy="category-input"]')
      .should('exist')
      .should('be.enabled')
      .should('contain.text', 'Välj ett alternativ')
      .select(mockMetadata?.categories?.[0]?.displayName || '');
    cy.get('[data-cy="type-input"]')
      .should('exist')
      .should('be.enabled')
      .should('contain.text', 'Välj ett alternativ')
      .select(mockMetadata?.categories?.[0]?.types?.[0]?.displayName || '');
    addStakeholder();

    //Uncomment when frontend functionality for adding stakeholder is ready and make an better implementation
    //cy.contains('Brukare').parent().parent().parent().next().children().children().get('[data-cy="add-manual-person-button"').should('not.exist')
    cy.get('[data-cy="save-draft-errand"]').should('exist').should('be.enabled').click();
    cy.wait('@createDraftErrand').then((intercept) => {
      expect(intercept.response?.statusCode).to.equal(200);
      expect(intercept.request.body.classification.category).to.equal(mockMetadata?.categories?.[0]?.name);
      expect(intercept.request.body.classification.type).to.equal(mockMetadata?.categories?.[0]?.types?.[0]?.name);
      expect(intercept.request.body.stakeholders?.length).to.equal(2);
    });
    cy.wait('@getCreatedErrand')
  });

  it('Reporter information should be displayed', () => {
    cy.get('[data-cy="reporter-card"]').should('exist').children().first().should('contain.text', 'REPORTER');
    cy.get('[data-cy="reporter-card"]')
      .should('exist')
      .children()
      .first()
      .should('contain.text', mockReporterStakeholder.firstName);
    cy.get('[data-cy="reporter-card"]')
      .should('exist')
      .children()
      .first()
      .should('contain.text', mockReporterStakeholder.lastName);
    cy.get('[data-cy="reporter-card"]')
      .should('exist')
      .children()
      .first()
      .should('contain.text', Cypress.env('mockEmail'));
    cy.get('[data-cy="reporter-card"]')
      .should('exist')
      .children()
      .first()
      .should('contain.text', Cypress.env('mockPhoneNumber'));
      cy.get('[data-cy="reporter-card"]').children('[data-cy="edit-card-button"]').should('not.exist');
      cy.get('[data-cy="reporter-card"]').children('[data-cy="remove-card-button"]').should('not.exist');
  });

  // TODO: Add test for registering complete errand when frontend functionality is ready

});
