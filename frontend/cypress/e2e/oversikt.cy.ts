import { mockCountDraftErrands, mockCountNewErrands, mockCountSolvedErrands } from 'cypress/fixtures/mockCount';
// import { mockEmptyErrands } from 'cypress/fixtures/mockEmptyErrands';
import { mockErrands } from 'cypress/fixtures/mockErrands';
import { mockMetadata } from 'cypress/fixtures/mockMetadata';
import { mockNotifications } from 'cypress/fixtures/mockNotifications';

describe('Overview page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/supportmanagement/errands?page=0*', mockErrands).as('getErrands');
    cy.intercept('GET', '**/supportmanagement/count?status=NEW', mockCountNewErrands).as('getCountNewErrands');
    cy.intercept('GET', '**/supportmanagement/count?status=DRAFT', mockCountDraftErrands).as('getCountDraftErrands');
    cy.intercept('GET', '**/supportmanagement/count?status=SOLVED', mockCountSolvedErrands).as('getCountSolvedErrands');
    cy.intercept('GET', '**/supportmanagement/notifications', mockNotifications).as('getNotifications');
    cy.intercept('GET', '**/supportmanagement/metadata', mockMetadata).as('getMetadata');
    cy.visit('/oversikt');
  });

  it('Show sidebar filter buttons with errand count', () => {
    cy.get('main').should('be.visible');
    cy.get('[aria-label="status-button-öppna ärenden"]')
      .should('exist')
      .should('be.enabled')
      .should('contain.text', `Öppna ärenden${mockCountNewErrands.count}`);
    cy.get('[aria-label="status-button-utkast"]')
      .should('exist')
      .should('be.enabled')
      .should('contain.text', `Utkast${mockCountDraftErrands.count}`);
    cy.get('[aria-label="status-button-avslutade ärenden"]')
      .should('exist')
      .should('be.enabled')
      .should('contain.text', `Avslutade ärenden${mockCountSolvedErrands.count}`);
    cy.get('[data-cy="logout-button"]').should('exist').should('be.enabled').should('contain.text', 'Logga ut').click();
  });

  it('Show correct errand table header and correct ammount of errands', () => {
    cy.get('[data-cy="errand-table"]').should('exist');

    const headerRow = cy.get('[data-cy="errand-table"] .sk-table-thead-tr').first();
    headerRow.get('th').eq(0).find('span').first().should('have.text', 'Status');
    headerRow.get('th').eq(1).find('span').first().should('have.text', 'Ärendenummer');
    headerRow.get('th').eq(2).find('span').first().should('have.text', 'Ärendetyp');
    headerRow.get('th').eq(3).find('span').first().should('have.text', 'Registrerat');

    cy.get('[data-cy="errand-table"] .sk-table-tbody-tr').should('have.length', mockErrands?.content?.length);
  });

  // TODO: Add test for search field when frontend functionality is ready
  // it('Can use searchfield', () => {
  //   cy.get('[data-cy="query-filter"]').should('exist').type('Text goes here');
  //   cy.get('button').contains('Sök').should('exist').click();
  //   cy.intercept('GET', '**/errands*', mockEmptyErrands).as(`emptyQuery-filterSearch`);
  //   cy.wait(`@emptyQuery-filterSearch`);
  //   cy.get('Caption#errandTableCaption').contains('Det finns inga ärenden').should('exist');

  //   cy.get('[data-cy="query-filter"]').should('exist').clear().type('balder');
  //   cy.get('button').contains('Sök').should('exist').click();
  //   cy.intercept('GET', '**/errands*', mockErrands).as(`listedQuery-filterSearch`);
  //   cy.wait(`@listedQuery-filterSearch`);
  //   cy.get('[data-cy="main-casedata-table"] .sk-table-tbody-tr').should(
  //     'have.length',
  //     mockErrands?.content?.length
  //   );
  // });

  // TODO: Add test for all filters
  // TODO: Add test for notification bell when frontend functionality is ready
});
