import type { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { mockManualEditStakeholder, mockReporterStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import {
  MOCK_COUNTRY_CODE_PHONE_NUMBER,
  MOCK_EMAIL,
  MOCK_INVALID_DATE_PERSON_NUMBER,
  MOCK_NON_EXISTENT_PERSON_NUMBER,
  MOCK_PERSON_NUMBER,
  MOCK_PHONE_NUMBER,
} from './constants';
import { emptyRoute, jsonRoute } from './routes';

/**
 * Hittar avsnittet med angiven rubrik. Rubriken matchas exakt, eftersom "Rapportör" annars
 * även träffar "Annan rapportör" och locatorn tyst pekar på två avsnitt.
 */
export const sectionByTitle = (page: Page, title: string): Locator =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

/** Verifierar både synligt fel och kopplingen från kontrollen för hjälpmedel. */
const expectFieldError = async (input: Locator, message: RegExp) => {
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(message);
  const descriptionIds = (await input.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
  expect(descriptionIds).toHaveLength(1);
  const fieldStatus = input.page().locator(`[id="${descriptionIds[0]}"]`);
  await expect(fieldStatus).toHaveText(message);
  await expect(fieldStatus).toBeVisible();
};

const expectFieldValid = async (input: Locator) => {
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await expect(input).not.toHaveAttribute('aria-describedby');
};

export const addStakeholder = async (page: Page, scope: Locator, role: string) => {
  await page.route(`**/citizen/person/${MOCK_PERSON_NUMBER}`, jsonRoute({ ...mockStakeholder, role }));
  await page.route(`**/citizen/person/${MOCK_NON_EXISTENT_PERSON_NUMBER}`, emptyRoute(204));

  const personNumberInput = scope.getByTestId('person-number-input');
  const searchButton = scope.locator('button', { hasText: 'Sök' });

  // Personnummer
  await personNumberInput.fill('PERSONNUMBER');
  await searchButton.click();
  await expectFieldError(scope.getByTestId('person-number-input'), /Personnummer måste|Ogiltigt datum i personnummer/);
  await personNumberInput.fill(MOCK_NON_EXISTENT_PERSON_NUMBER);
  const emptyPersonResponse = page.waitForResponse(`**/citizen/person/${MOCK_NON_EXISTENT_PERSON_NUMBER}`);
  await searchButton.click();
  await emptyPersonResponse;
  await expectFieldError(scope.getByTestId('person-number-input'), /Ingen person hittades/);
  await scope.getByRole('button', { name: 'Rensa sökning' }).click();
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await personNumberInput.fill(MOCK_INVALID_DATE_PERSON_NUMBER);
  await searchButton.click();
  await expectFieldError(scope.getByTestId('person-number-input'), /Personnummer måste|Ogiltigt datum i personnummer/);
  await scope.getByRole('button', { name: 'Rensa sökning' }).click();
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await personNumberInput.fill(MOCK_PERSON_NUMBER);
  const personResponse = page.waitForResponse(`**/citizen/person/${MOCK_PERSON_NUMBER}`);
  await searchButton.click();
  await personResponse;

  // E-post
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await expectFieldValid(scope.getByTestId('stakeholder-email-input'));
  await expectFieldValid(scope.getByTestId('stakeholder-mobilephone-input'));
  const emailInput = scope.getByTestId('stakeholder-email-input');
  await emailInput.fill('EMAIL');
  await scope.locator('button', { hasText: 'Lägg till person' }).click();
  await expectFieldError(scope.getByTestId('stakeholder-email-input'), /Ogiltig e-postadress/);
  await emailInput.fill(MOCK_EMAIL);

  // Telefon
  const phoneInput = scope.getByTestId('stakeholder-mobilephone-input');
  await phoneInput.fill('PHONENUMBER');
  await expectFieldError(scope.getByTestId('stakeholder-mobilephone-input'), /Fyll i ett giltigt mobilnummer/);
  await phoneInput.fill(MOCK_PHONE_NUMBER);
  await scope.locator('button', { hasText: 'Lägg till person' }).click();
};

export const addEmployeeStakeholder = async (page: Page, scope: Locator, role: string) => {
  await page.route('**/employee/personal/ABC12DEF', jsonRoute({ ...mockReporterStakeholder, role }));
  await page.route('**/employee/personal/ADACCOUNT', emptyRoute(204));

  const personNumberInput = scope.getByTestId('person-number-input');
  const searchButton = scope.locator('button', { hasText: 'Sök' });

  // Sök på AD-konto i stället för personnummer
  await expect(scope.getByTestId('radiobutton-person')).toBeAttached();
  await scope.getByTestId('radiobutton-employee').getByRole('radio').check();

  await personNumberInput.fill('ADACCOUNT');
  const emptyPersonResponse = page.waitForResponse('**/employee/personal/ADACCOUNT');
  await searchButton.click();
  await expectFieldError(scope.getByTestId('person-number-input'), /Ingen person hittades/);
  await emptyPersonResponse;
  await scope.getByRole('button', { name: 'Rensa sökning' }).click();
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await personNumberInput.fill('ABC12DEF');
  const personResponse = page.waitForResponse('**/employee/personal/ABC12DEF');
  await searchButton.click();
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await personResponse;

  // E-post
  await expectFieldValid(scope.getByTestId('person-number-input'));
  await expectFieldValid(scope.getByTestId('stakeholder-email-input'));
  await expectFieldValid(scope.getByTestId('stakeholder-mobilephone-input'));
  await expect(scope.getByTestId('stakeholder-email-input')).toHaveValue(mockReporterStakeholder.emails?.[0] ?? '');

  // Telefon
  await expect(scope.getByTestId('stakeholder-mobilephone-input')).toHaveValue(
    mockReporterStakeholder.phoneNumbers?.[0] ?? ''
  );
  await scope.locator('button', { hasText: 'Lägg till person' }).click();
};

export const manuallyAddStakeholder = async (page: Page) => {
  const modal = page.getByTestId('manual-person-modal').filter({ visible: true });
  await expect(modal).toBeVisible();

  // Inga fel initialt
  await expectFieldValid(modal.getByTestId('modal-firstName-input'));
  await expectFieldValid(modal.getByTestId('modal-lastName-input'));
  await expectFieldValid(modal.getByTestId('modal-email-input'));
  await expectFieldValid(modal.getByTestId('modal-phone-input'));

  // Fel visas efter första försöket att spara
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-firstName-input'), /Förnamn får inte vara tomt/);
  await expectFieldError(modal.getByTestId('modal-lastName-input'), /Efternamn får inte vara tomt/);
  await expectFieldValid(modal.getByTestId('modal-email-input'));
  await expectFieldValid(modal.getByTestId('modal-phone-input'));

  // Personnummer kan inte anges vid manuell registrering
  await expect(modal.getByTestId('modal-personNumber-input')).toHaveCount(0);

  // Namn
  await modal.getByTestId('modal-firstName-input').fill('Test');
  await modal.getByTestId('modal-lastName-input').fill('Testsson');
  await expectFieldValid(modal.getByTestId('modal-firstName-input'));
  await expectFieldValid(modal.getByTestId('modal-lastName-input'));

  // E-post
  await modal.getByTestId('modal-email-input').fill('test');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-email-input'), /Ogiltig e-postadress/);
  await modal.getByTestId('modal-email-input').fill(MOCK_EMAIL);
  await expectFieldValid(modal.getByTestId('modal-email-input'));

  // Telefon
  await modal.getByTestId('modal-phone-input').fill('Testsson');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-phone-input'), /Fyll i ett giltigt mobilnummer/);
  await modal.getByTestId('modal-phone-input').fill(MOCK_PHONE_NUMBER);
  await expectFieldValid(modal.getByTestId('modal-phone-input'));

  // Adressfält finns inte vid manuell registrering
  await expect(modal.getByTestId('modal-address-input')).toHaveCount(0);
};

export const manuallyEditStakeholder = async (page: Page, stakeholder: StakeholderDTO) => {
  const modal = page.getByTestId('manual-person-modal').filter({ visible: true });
  await expect(modal).toBeVisible();

  // Inga fel initialt
  await expectFieldValid(modal.getByTestId('modal-firstName-input'));
  await expectFieldValid(modal.getByTestId('modal-lastName-input'));
  await expectFieldValid(modal.getByTestId('modal-email-input'));
  await expectFieldValid(modal.getByTestId('modal-phone-input'));

  // Personnummer visas inte i redigeringsmodalen
  await expect(modal.getByTestId('modal-personNumber-input')).toHaveCount(0);

  // Namn
  const firstNameInput = modal.getByTestId('modal-firstName-input');
  await expect(firstNameInput).toHaveValue(stakeholder.firstName ?? '');
  await firstNameInput.fill('');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-firstName-input'), /Förnamn får inte vara tomt/);
  await firstNameInput.fill(mockManualEditStakeholder.firstName ?? '');
  await expectFieldValid(modal.getByTestId('modal-firstName-input'));
  const lastNameInput = modal.getByTestId('modal-lastName-input');
  await expect(lastNameInput).toHaveValue(stakeholder.lastName ?? '');
  await lastNameInput.fill('');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-lastName-input'), /Efternamn får inte vara tomt/);
  await lastNameInput.fill(mockManualEditStakeholder.lastName ?? '');
  await expectFieldValid(modal.getByTestId('modal-lastName-input'));

  // E-post
  const emailInput = modal.getByTestId('modal-email-input');
  await expect(emailInput).toHaveValue(MOCK_EMAIL);
  await emailInput.fill('test');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-email-input'), /Ogiltig e-postadress/);
  await emailInput.fill(MOCK_EMAIL);
  await expectFieldValid(modal.getByTestId('modal-email-input'));
  await emailInput.fill('');

  // Telefon
  const phoneInput = modal.getByTestId('modal-phone-input');
  await expect(phoneInput).toHaveValue(MOCK_COUNTRY_CODE_PHONE_NUMBER);
  await phoneInput.fill('Testsson');
  await modal.getByTestId('modal-add-person-button').click();
  await expectFieldError(modal.getByTestId('modal-phone-input'), /Fyll i ett giltigt mobilnummer/);
  await phoneInput.fill(MOCK_PHONE_NUMBER);
  await expectFieldValid(modal.getByTestId('modal-phone-input'));

  // Adress
  const addressInput = modal.getByTestId('modal-address-input');
  await expect(addressInput).toHaveValue(stakeholder.address ?? '');
  await addressInput.fill(mockManualEditStakeholder.address ?? '');
  const careOfInput = modal.getByTestId('modal-careOf-input');
  await expect(careOfInput).toHaveValue(stakeholder.careOf ?? '');
  await careOfInput.fill(mockManualEditStakeholder.careOf ?? '');
  const zipCodeInput = modal.getByTestId('modal-zipCode-input');
  await expect(zipCodeInput).toHaveValue(stakeholder.zipCode ?? '');
  await zipCodeInput.fill(mockManualEditStakeholder.zipCode ?? '');
  const cityInput = modal.getByTestId('modal-city-input');
  await expect(cityInput).toHaveValue(stakeholder.city ?? '');
  await cityInput.fill(mockManualEditStakeholder.city ?? '');
};
