import '@cypress/code-coverage/support';

import { CookieConsentUtils } from '@sk-web-gui/react';
import { getMe } from '../fixtures/getMe';

export const DEFAULT_COOKIE_VALUE = 'necessary%2Cstats';

localStorage.clear();

beforeEach(() => {
  cy.setCookie(CookieConsentUtils.defaultCookieConsentName, DEFAULT_COOKIE_VALUE);
  cy.viewport('macbook-16');
  cy.intercept('GET', '**/api/me', getMe).as('getMe');
});
