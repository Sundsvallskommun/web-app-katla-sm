import { mockStakeholder } from 'cypress/fixtures/mockStakeholder';

export const addStakeholder = () => {
  cy.intercept('GET', `**/citizen/person/${Cypress.env('mockPersonNumber')}`, mockStakeholder).as(
    'getPersonByPersonNumber'
  );
  cy.get('[data-cy="person-number-input"]').first().type(Cypress.env('mockPersonNumber'));
  cy.get('button').contains('Sök').should('exist').click();
  cy.wait('@getPersonByPersonNumber');
  cy.get('[data-cy="stakeholder-email-input"]').should('exist').type(Cypress.env('mockEmail'));
  cy.get('[data-cy="stakeholder-mobilephone-input"]').should('exist').type(Cypress.env('mockPhoneNumber'));
  cy.get('button').contains('Lägg till person').should('exist').click();
};
