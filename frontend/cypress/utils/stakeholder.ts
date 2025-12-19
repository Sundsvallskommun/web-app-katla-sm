import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { mockManualEditStakeholder, mockReporterStakeholder, mockStakeholder } from 'cypress/fixtures/mockStakeholder';

export const addStakeholder = (role: string) => {
  cy.intercept('GET', `**/citizen/person/${Cypress.env('mockPersonNumber')}`, { ...mockStakeholder, role: role }).as(
    'getPersonByPersonNumber'
  );
  cy.intercept('GET', `**/citizen/person/${Cypress.env('mockNonExistentPersonNumber')}`, {
    statusCode: 204,
    data: {},
  }).as('getEmptyPerson');

  //Personnumber
  cy.get('[data-cy="person-number-input"]').type('PERSONNUMBER');
  cy.get('button').contains('Sök').should('exist').click();
  cy.get('[data-cy="person-number-error').should('be.visible');
  cy.get('[data-cy="person-number-input"]').clear().type(Cypress.env('mockNonExistentPersonNumber'));
  cy.get('button').contains('Sök').should('exist').click();
  cy.wait('@getEmptyPerson');
  cy.get('[data-cy="empty-person-error').should('be.visible');
  cy.get('button[aria-label="Rensa"]').should('be.visible').click();
  cy.get('[data-cy="empty-person-error').should('not.exist');
  cy.get('[data-cy="person-number-input"]').clear().type(Cypress.env('mockInvalidDatePersonNumber'));
  cy.get('button').contains('Sök').should('exist').click();
  cy.get('[data-cy="person-number-error').should('be.visible');
  cy.get('button[aria-label="Rensa"]').should('be.visible').click();
  cy.get('[data-cy="person-number-error').should('not.exist');
  cy.get('[data-cy="person-number-input"]').clear().type(Cypress.env('mockPersonNumber'));
  cy.get('button').contains('Sök').should('exist').click();
  cy.wait('@getPersonByPersonNumber');

  //Email
  cy.get('[data-cy="person-number-error').should('not.exist');
  cy.get('[data-cy="email-input-error').should('not.exist');
  cy.get('[data-cy="phone-number-input-error').should('not.exist');
  cy.get('[data-cy="stakeholder-email-input"]').should('exist').type('EMAIL');
  cy.get('button').contains('Lägg till person').should('exist').click();
  cy.get('[data-cy="email-input-error').should('be.visible');
  cy.get('[data-cy="stakeholder-email-input"]').should('exist').clear().type(Cypress.env('mockEmail'));

  //Phone
  cy.get('[data-cy="stakeholder-mobilephone-input"]').should('exist').type('PHONENUMBER');
  cy.get('[data-cy="phone-number-input-error').should('be.visible');
  cy.get('[data-cy="stakeholder-mobilephone-input"]').should('exist').clear().type(Cypress.env('mockPhoneNumber'));
  cy.get('button').contains('Lägg till person').should('exist').click();
};

export const addEmployeeStakeholder = (role: string) => {
  cy.intercept('GET', `**/employee/personal/ABC12DEF`, { ...mockReporterStakeholder, role: role }).as(
    'getPersonByAdAccount'
  );
  cy.intercept('GET', `**/employee/personal/ADACCOUNT`, {
    statusCode: 204,
    data: {},
  }).as('getEmptyPerson');

  //Personnumber
  cy.get('[data-cy="radiobutton-person"]').should('exist');
  cy.get('[data-cy="radiobutton-employee"]').should('exist').check();

  cy.get('[data-cy="person-number-input"]').type('ADACCOUNT');
  cy.get('button').contains('Sök').should('exist').click();
  cy.get('[data-cy="empty-person-error').should('be.visible');
  cy.wait('@getEmptyPerson');
  cy.get('button[aria-label="Rensa"]').should('be.visible').click();
  cy.get('[data-cy="empty-person-error').should('not.exist');
  cy.get('[data-cy="person-number-input"]').clear().type('ABC12DEF');
  cy.get('button').contains('Sök').should('exist').click();
  cy.get('[data-cy="person-number-error').should('not.exist');
  cy.wait('@getPersonByAdAccount');

  //Email
  cy.get('[data-cy="person-number-error').should('not.exist');
  cy.get('[data-cy="email-input-error').should('not.exist');
  cy.get('[data-cy="phone-number-input-error').should('not.exist');
  cy.get('[data-cy="stakeholder-email-input"]').should('have.value', mockReporterStakeholder.emails?.[0]);

  //Phone
  cy.get('[data-cy="stakeholder-mobilephone-input"]').should('have.value', mockReporterStakeholder.phoneNumbers?.[0]);
  cy.get('button').contains('Lägg till person').should('exist').click();
};

export const manuallyAddStakeholder = () => {
  cy.get('[data-cy="manual-person-modal"]').should('exist');

  //No errors
  cy.get('[data-cy="firstName-input-error"]').should('not.exist');
  cy.get('[data-cy="lastName-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-email-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-phone-input-error"]').should('not.exist');

  //Errors after first try to submit
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="firstName-input-error"]').should('be.visible');
  cy.get('[data-cy="lastName-input-error"]').should('be.visible');
  cy.get('[data-cy="modal-email-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-phone-input-error"]').should('not.exist');

  //PersonNumber
  cy.get('[data-cy="modal-personNumber-input"]').should('have.attr', 'readOnly');

  //Name
  cy.get('[data-cy="modal-firstName-input"]').type('Test');
  cy.get('[data-cy="modal-lastName-input"]').type('Testsson');
  cy.get('[data-cy="firstName-input-error"]').should('not.exist');
  cy.get('[data-cy="lastName-input-error"]').should('not.exist');

  //Email
  cy.get('[data-cy="modal-email-input"]').type('test');
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="modal-email-input-error"]').should('be.visible');
  cy.get('[data-cy="modal-email-input"]').clear().type(Cypress.env('mockEmail'));
  cy.get('[data-cy="modal-email-input-error"]').should('not.exist');

  //Phone
  cy.get('[data-cy="modal-phone-input"]').type('Testsson');
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="modal-phone-input-error"]').should('be.visible');
  cy.get('[data-cy="modal-phone-input"]').clear().type(Cypress.env('mockPhoneNumber'));
  cy.get('[data-cy="modal-phone-input-error"]').should('not.exist');

  //Address
  cy.get('[data-cy="modal-address-input"]').type('Address');
  cy.get('[data-cy="modal-careOf-input"]').type('careOf');
  cy.get('[data-cy="modal-zipCode-input"]').type('123 45');
  cy.get('[data-cy="modal-city-input"]').type('city');
};

export const manuallyEditStakeholder = (stakeholder: StakeholderDTO) => {
  cy.get('[data-cy="manual-person-modal"]').should('exist');

  //No errors
  cy.get('[data-cy="firstName-input-error"]').should('not.exist');
  cy.get('[data-cy="lastName-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-email-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-phone-input-error"]').should('not.exist');

  //PersonNumber
  cy.get('[data-cy="modal-personNumber-input"]').should('have.value', stakeholder.personNumber ?? '');

  //Name
  cy.get('[data-cy="modal-firstName-input"]').should('have.value', stakeholder.firstName).clear();
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="firstName-input-error"]').should('exist');
  cy.get('[data-cy="modal-firstName-input"]').type(mockManualEditStakeholder.firstName || '');
  cy.get('[data-cy="firstName-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-lastName-input"]').should('have.value', stakeholder.lastName).clear();
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="lastName-input-error"]').should('exist');
  cy.get('[data-cy="modal-lastName-input"]').type(mockManualEditStakeholder.lastName || '');
  cy.get('[data-cy="lastName-input-error"]').should('not.exist');

  //Email
  cy.get('[data-cy="modal-email-input"]').should('have.value', Cypress.env('mockEmail')).clear().type('test');
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="modal-email-input-error"]').should('be.visible');
  cy.get('[data-cy="modal-email-input"]').clear().type(Cypress.env('mockEmail'));
  cy.get('[data-cy="modal-email-input-error"]').should('not.exist');
  cy.get('[data-cy="modal-email-input"]').clear();

  //Phone
  cy.get('[data-cy="modal-phone-input"]')
    .should('have.value', Cypress.env('mockCountryCodePhoneNumber'))
    .clear()
    .type('Testsson');
  cy.get('[data-cy="modal-add-person-button"]').should('exist').click();
  cy.get('[data-cy="modal-phone-input-error"]').should('be.visible');
  cy.get('[data-cy="modal-phone-input"]').clear().type(Cypress.env('mockPhoneNumber'));
  cy.get('[data-cy="modal-phone-input-error"]').should('not.exist');

  //Address
  cy.get('[data-cy="modal-address-input"]')
    .should('have.value', stakeholder.address)
    .clear()
    .type(mockManualEditStakeholder.address || '');
  cy.get('[data-cy="modal-careOf-input"]')
    .should('have.value', stakeholder.careOf ?? '')
    .clear()
    .type(mockManualEditStakeholder.careOf || '');
  cy.get('[data-cy="modal-zipCode-input"]')
    .should('have.value', stakeholder.zipCode)
    .clear()
    .type(mockManualEditStakeholder.zipCode || '');
  cy.get('[data-cy="modal-city-input"]')
    .should('have.value', stakeholder.city)
    .clear()
    .type(mockManualEditStakeholder.city || '');
};
