import { mockErrand } from 'cypress/fixtures/mockErrand';
import { mockMetadata } from 'cypress/fixtures/mockMetadata';
import { mockManualEditStakeholder, mockReporterStakeholder, mockStakeholder } from 'cypress/fixtures/mockStakeholder';
import {
  addEmployeeStakeholder,
  addStakeholder,
  manuallyAddStakeholder,
  manuallyEditStakeholder,
} from 'cypress/utils/stakeholder';
import { useMetadataStore } from 'src/stores/metadata-store';

describe('Register new errand page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/employee/personal/*', mockReporterStakeholder).as('getReporterStakeholder');
    useMetadataStore.setState({ metadata: mockMetadata });
    cy.visit('/arende/registrera');
  });

  it('Add stakeholders using personnumber and register draft errand', () => {
    cy.intercept('POST', '**/supportmanagement/errand/create', mockErrand).as('createDraftErrand');
    cy.intercept('GET', '**/supportmanagement/errand/**', mockErrand).as('getCreatedErrand');
    cy.get('main').should('be.visible');

    //Om ärendet
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

    //Brukare
    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        addStakeholder('PRIMARY');
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');
      });

    //Övriga parter
    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        ['CONTACT', 'CONTACT'].forEach((role) => {
          addStakeholder(role);
          cy.get('[data-cy="edit-card-button"]').should('exist');
          cy.get('[data-cy="remove-card-button"]').should('exist');
          cy.get('[data-cy="add-manual-person-button"]').should('exist');
        });
      });
    cy.get('[data-cy="save-draft-errand"]').should('exist').should('be.enabled').click();
    cy.wait('@createDraftErrand').then((intercept) => {
      expect(intercept.response?.statusCode).to.equal(200);
      expect(intercept.request.body.classification.category).to.equal(mockMetadata?.categories?.[0]?.name);
      expect(intercept.request.body.classification.type).to.equal(mockMetadata?.categories?.[0]?.types?.[0]?.name);
      expect(intercept.request.body.stakeholders?.length).to.equal(4);
    });
    cy.wait('@getCreatedErrand');
  });

  it('Manually add stakeholders and register draft errand', () => {
    cy.intercept('POST', '**/supportmanagement/errand/create', mockErrand).as('createDraftErrand');
    cy.intercept('GET', '**/supportmanagement/errand/**', mockErrand).as('getCreatedErrand');
    cy.get('main').should('be.visible');

    //Om ärendet
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

    //Brukare
    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="add-manual-person-button"]').should('exist').click();
      });

    manuallyAddStakeholder();
    cy.get('[data-cy="modal-cancel-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="reporter-card"]').should('not.exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist').click();
      });

    manuallyAddStakeholder();
    cy.get('[data-cy="modal-add-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');
      });

    //Övriga parter
    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="add-manual-person-button"]').should('exist').click();
      });

    manuallyAddStakeholder();
    cy.get('[data-cy="modal-cancel-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="reporter-card"]').should('not.exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist').click();
      });

    manuallyAddStakeholder();
    cy.get('[data-cy="modal-add-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist');
      });

    cy.get('[data-cy="save-draft-errand"]').should('exist').should('be.enabled').click();
    cy.wait('@createDraftErrand').then((intercept) => {
      expect(intercept.response?.statusCode).to.equal(200);
      expect(intercept.request.body.classification.category).to.equal(mockMetadata?.categories?.[0]?.name);
      expect(intercept.request.body.classification.type).to.equal(mockMetadata?.categories?.[0]?.types?.[0]?.name);
      expect(intercept.request.body.stakeholders?.length).to.equal(3);
    });
    cy.wait('@getCreatedErrand');
  });

  it('Manually edit stakeholder and remove stakeholder', () => {
    cy.intercept('POST', '**/supportmanagement/errand/create', mockErrand).as('createDraftErrand');
    cy.intercept('GET', '**/supportmanagement/errand/**', mockErrand).as('getCreatedErrand');
    cy.get('main').should('be.visible');

    //Om ärendet
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

    //Brukare
    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        addStakeholder('PRIMARY');
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');
        cy.get('[data-cy="remove-card-button"]').should('exist').click();
        cy.get('[data-cy="add-manual-person-button"]').should('exist');
        addStakeholder('PRIMARY');
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');
        cy.get('[data-cy="edit-card-button"]').should('exist').click();
      });

    manuallyEditStakeholder(mockStakeholder);
    cy.get('[data-cy="modal-cancel-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');

        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-role"]')
          .should('contain.text', 'Ärendeägare');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-name"]')
          .should('contain.text', mockStakeholder.firstName + ' ' + mockStakeholder.lastName);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-personNumber"]')
          .should('contain.text', Cypress.env('mockHyphenPersonNumber'));
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-address"]')
          .should('contain.text', mockStakeholder.address + ' ' + mockStakeholder.city);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-email"]')
          .should('contain.text', Cypress.env('mockEmail'));
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-phonenumber"]')
          .should('contain.text', Cypress.env('mockCountryCodePhoneNumber'));
        cy.get('[data-cy="edit-card-button"]').should('exist').click();
      });

    manuallyEditStakeholder(mockStakeholder);
    cy.get('[data-cy="modal-add-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Brukare')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');

        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-role"]')
          .should('contain.text', 'Ärendeägare');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-name"]')
          .should('contain.text', mockManualEditStakeholder.firstName + ' ' + mockManualEditStakeholder.lastName);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-personNumber"]')
          .should('contain.text', Cypress.env('mockHyphenPersonNumber'));
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-address"]')
          .should('contain.text', mockManualEditStakeholder.address + ' ' + mockManualEditStakeholder.city);
        cy.get('[data-cy="stakeholder-card"]').find('[data-cy="stakeholder-email"]').should('contain.text', '');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-phonenumber"]')
          .should('contain.text', Cypress.env('mockCountryCodePhoneNumber'));
      });

    cy.get('[data-cy="save-draft-errand"]').should('exist').should('be.enabled').click();
    cy.wait('@createDraftErrand').then((intercept) => {
      expect(intercept.response?.statusCode).to.equal(200);
      expect(intercept.request.body.classification.category).to.equal(mockMetadata?.categories?.[0]?.name);
      expect(intercept.request.body.classification.type).to.equal(mockMetadata?.categories?.[0]?.types?.[0]?.name);
      expect(intercept.request.body.stakeholders?.length).to.equal(2);
    });
    cy.wait('@getCreatedErrand');
  });

  it('Manually edit employee stakeholder and remove stakeholder', () => {
    cy.intercept('POST', '**/supportmanagement/errand/create', mockErrand).as('createDraftErrand');
    cy.intercept('GET', '**/supportmanagement/errand/**', mockErrand).as('getCreatedErrand');
    cy.get('main').should('be.visible');

    //Om ärendet
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

    //Övriga parter
    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        addEmployeeStakeholder('CONTACT');
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist').click();

        addEmployeeStakeholder('CONTACT');
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist');
        cy.get('[data-cy="edit-card-button"]').should('exist').click();
      });

    manuallyEditStakeholder(mockReporterStakeholder);
    cy.get('[data-cy="modal-cancel-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist');

        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-role"]')
          .should('contain.text', 'Kontaktperson');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-name"]')
          .should('contain.text', mockReporterStakeholder.firstName + ' ' + mockReporterStakeholder.lastName);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-title"]')
          .should('contain.text', mockReporterStakeholder.title);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-department"]')
          .should('contain.text', mockReporterStakeholder.department);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-email"]')
          .should('contain.text', Cypress.env('mockEmail'));
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-phonenumber"]')
          .should('contain.text', Cypress.env('mockCountryCodePhoneNumber'));
        cy.get('[data-cy="edit-card-button"]').should('exist').click();
      });

    manuallyEditStakeholder(mockReporterStakeholder);
    cy.get('[data-cy="modal-add-person-button"]').should('exist').click();

    cy.get('.sk-disclosure-header-title')
      .contains('Övriga parter')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="edit-card-button"]').should('exist');
        cy.get('[data-cy="remove-card-button"]').should('exist');
        cy.get('[data-cy="add-manual-person-button"]').should('exist');

        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-role"]')
          .should('contain.text', 'Kontaktperson');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-name"]')
          .should('contain.text', mockManualEditStakeholder.firstName + ' ' + mockManualEditStakeholder.lastName);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-title"]')
          .should('contain.text', mockReporterStakeholder.title);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-department"]')
          .should('contain.text', mockReporterStakeholder.department);
        cy.get('[data-cy="stakeholder-card"]').find('[data-cy="stakeholder-email"]').should('contain.text', '');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-phonenumber"]')
          .should('contain.text', Cypress.env('mockCountryCodePhoneNumber'));
      });

    cy.get('[data-cy="save-draft-errand"]').should('exist').should('be.enabled').click();
    cy.wait('@createDraftErrand').then((intercept) => {
      expect(intercept.response?.statusCode).to.equal(200);
      expect(intercept.request.body.classification.category).to.equal(mockMetadata?.categories?.[0]?.name);
      expect(intercept.request.body.classification.type).to.equal(mockMetadata?.categories?.[0]?.types?.[0]?.name);
      expect(intercept.request.body.stakeholders?.length).to.equal(2);
    });
    cy.wait('@getCreatedErrand');
  });

  it('Reporter information should be displayed', () => {
    cy.wait('@getReporterStakeholder');
    cy.get('.sk-disclosure-header-title')
      .contains('Rapportör')
      .closest('.sk-disclosure')
      .within(() => {
        cy.get('[data-cy="stakeholder-card"]').find('[data-cy="stakeholder-role"]').should('contain.text', 'Rapportör');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-title"]')
          .should('contain.text', mockReporterStakeholder.title);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-department"]')
          .should('contain.text', mockReporterStakeholder.department);
        cy.get('[data-cy="stakeholder-card"]').find('[data-cy="stakeholder-personNumber"]').should('not.exist');
        cy.get('[data-cy="stakeholder-card"]').find('[data-cy="stakeholder-address"]').should('not.exist');
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-name"]')
          .should('contain.text', mockReporterStakeholder.firstName + ' ' + mockReporterStakeholder.lastName);
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-email"]')
          .should('contain.text', Cypress.env('mockEmail'));
        cy.get('[data-cy="stakeholder-card"]')
          .find('[data-cy="stakeholder-phonenumber"]')
          .should('contain.text', Cypress.env('mockCountryCodePhoneNumber'));

        cy.get('[data-cy="edit-card-button"]').should('not.exist');
        cy.get('[data-cy="remove-card-button"]').should('not.exist');
        cy.get('[data-cy="add-manual-person-button"]').should('not.exist');
      });
  });

  // TODO: Add test for registering complete errand when frontend functionality is ready
});
