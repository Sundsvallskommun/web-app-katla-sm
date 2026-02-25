import { mockEmptyErrands } from 'cypress/fixtures/mockEmptyErrands';
import { mockErrands } from 'cypress/fixtures/mockErrands';
import { mockMetadata } from 'cypress/fixtures/mockMetadata';
import { mockNotifications } from 'cypress/fixtures/mockNotifications';
import { mockCountNewErrands, mockCountDraftErrands, mockCountSolvedErrands } from 'cypress/fixtures/mockCount';

describe('Mobile search and filter', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');

    cy.intercept('GET', '**/supportmanagement/errands*', mockErrands).as('getErrands');
    cy.intercept('GET', '**/supportmanagement/count?status=NEW', mockCountNewErrands).as('getCountNew');
    cy.intercept('GET', '**/supportmanagement/count?status=DRAFT', mockCountDraftErrands).as('getCountDraft');
    cy.intercept('GET', '**/supportmanagement/count?status=SOLVED', mockCountSolvedErrands).as('getCountSolved');
    cy.intercept('GET', '**/supportmanagement/notifications', mockNotifications).as('getNotifications');
    cy.intercept('GET', '**/supportmanagement/metadata', mockMetadata).as('getMetadata');

    cy.visit('/oversikt');
    cy.wait('@getErrands');
  });

  const openSearch = () => {
    cy.get('[aria-label="Sök"]').click();
    cy.get('input[placeholder="Skriv för att söka"]').should('be.visible');
  };

  const applyFilters = () => {
    cy.contains('button', 'Sök/Filtrera').click();
  };

  describe('Free text search', () => {
    it('sends a single search term to the API', () => {
      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('balder{enter}');
      cy.contains('Sökord: balder').should('exist');

      applyFilters();

      cy.wait('@getErrands').its('request.url').should('include', 'search=balder');
    });

    it('sends multiple search terms to the API', () => {
      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('alfa{enter}');
      cy.contains('Sökord: alfa').should('exist');

      cy.get('input[placeholder="Skriv för att söka"]').type('beta{enter}');
      cy.contains('Sökord: beta').should('exist');

      applyFilters();

      cy.wait('@getErrands').its('request.url').then((url) => {
        const params = new URLSearchParams(url.split('?')[1]);
        const search = params.get('search');
        expect(search).to.include('alfa');
        expect(search).to.include('beta');
      });
    });

    it('does not send search param when no search terms are added', () => {
      openSearch();
      applyFilters();

      cy.wait('@getErrands').its('request.url').should('not.include', 'search=');
    });

    it('can remove a search chip before applying', () => {
      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('borttagbar{enter}');
      cy.contains('Sökord: borttagbar').should('exist');

      // Click the chip to remove it
      cy.contains('Sökord: borttagbar').closest('.sk-chip').click();
      cy.contains('Sökord: borttagbar').should('not.exist');

      applyFilters();

      cy.wait('@getErrands').its('request.url').should('not.include', 'search=');
    });

    it('does not add duplicate search terms', () => {
      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('samma{enter}');
      cy.get('input[placeholder="Skriv för att söka"]').type('samma{enter}');

      // Should only show one chip
      cy.get('.sk-chip').filter(':contains("Sökord: samma")').should('have.length', 1);
    });
  });

  describe('Category filter', () => {
    it('sends category type to the API', () => {
      openSearch();

      // Open category dropdown
      cy.contains('button', 'Ärendetyp').click();

      // Select a type (displayName from mockMetadata)
      cy.contains('typtest').click();

      applyFilters();

      cy.wait('@getErrands').its('request.url').should('include', 'type=TYPETEST');
    });
  });

  describe('Combined filters', () => {
    it('sends both search and category filter to the API', () => {
      openSearch();

      // Add search term
      cy.get('input[placeholder="Skriv för att söka"]').type('combined{enter}');

      // Select category
      cy.contains('button', 'Ärendetyp').click();
      cy.contains('typtest').click();

      applyFilters();

      cy.wait('@getErrands').its('request.url').then((url) => {
        expect(url).to.include('search=combined');
        expect(url).to.include('type=TYPETEST');
      });
    });
  });

  describe('Search results', () => {
    it('shows errands when search returns results', () => {
      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('existing{enter}');
      applyFilters();

      cy.wait('@getErrands');
      cy.contains('AIA-25120019').should('exist');
    });

    it('shows empty state when search returns no results', () => {
      // Override intercept to return empty results for next call
      cy.intercept('GET', '**/supportmanagement/errands*', mockEmptyErrands).as('getEmptyErrands');

      openSearch();
      cy.get('input[placeholder="Skriv för att söka"]').type('nonexistent{enter}');
      applyFilters();

      cy.wait('@getEmptyErrands');
      cy.contains('Inga ärenden').should('exist');
    });
  });
});
