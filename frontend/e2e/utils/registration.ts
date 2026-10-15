import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { MOCK_PLACE_NAME } from '../fixtures/mockMetadata';

/**
 * Väljer platsen i platsväljaren. Väljaren skriver valet till formulärdatan några millisekunder
 * efter att listan stängts, och en ändring i ett annat schemafält inom det fönstret skriver över
 * valet. Ingen användare hinner dit, men Playwright gör det – därför görs valet sist i formuläret.
 */
export const selectFacility = async (page: Page, placeName = MOCK_PLACE_NAME) => {
  // Combobox-rollen ligger på omslutande element; själva sökfältet är en textbox med fältets etikett.
  const facilitySearch = page.getByRole('textbox', { name: /Enhet eller avdelning/ });
  await facilitySearch.click();
  // Listan öppnas av tangenttryckningar, inte av ett satt värde. Söktexten är bara början av namnet,
  // så att fältet visar hela namnet först när platsen faktiskt är vald.
  await facilitySearch.pressSequentially(placeName.slice(0, 2));
  await expect(page.getByRole('option', { name: placeName, exact: true })).toBeVisible();
  await facilitySearch.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(facilitySearch).toHaveValue(placeName);
};
