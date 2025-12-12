describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should render correct html structure', () => {
    cy.get('main').should('be.visible');
    cy.get('h1').should('be.visible').should('contain.text', 'Välj hur du vill logga in');
    cy.get('[data-cy="login-button"]')
      .should('be.visible')
      .should('be.enabled')
      .should('contain.text', 'Logga in')
      .click();
  });
});
