import type { Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER, MOCK_EMAIL, MOCK_HYPHEN_PERSON_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import { addEmployeeStakeholder, addStakeholder, manuallyAddStakeholder, sectionByTitle } from '../utils/stakeholder';
import { expect, test } from '../utils/test';

const MOCK_FORM_SCHEMA_NAME = 'avvikelse-plats-handelse';
const MOCK_FORM_SCHEMA_ID = 'e2e-avvikelse-plats-handelse-v1';
const MOCK_INCIDENT_DESCRIPTION = 'Händelsen inträffade i testmiljön';
const mockFormSchemaResponse = {
  schemaId: MOCK_FORM_SCHEMA_ID,
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      incidentDescription: {
        type: 'string',
        title: 'Beskriv händelsen',
        minLength: 1,
      },
    },
    required: ['incidentDescription'],
  },
  uiSchema: {},
};

/** Registrerar ärendet och verifierar POST-anropet, motsvarar cy.wait('@createDraftErrand') med assertions */
interface CreateErrandRequestBody {
  jsonParameters?: { key: string; value: unknown; schemaId: string }[];
  parameters?: { key: string; values: string[] }[];
  stakeholders?: unknown[];
}

/**
 * Öppnar bekräftelsedialogen och returnerar submit-knappen. Delas av lyckade och
 * misslyckade registreringar så att båda vägarna passerar samma kontroller.
 */
const openRegistrationConfirmation = async (page: Page) => {
  const registerButton = page.getByTestId('register-errand');
  await expect(registerButton).toBeEnabled();
  await registerButton.click();
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeEnabled();
  return submitButton;
};

const registerErrandAndExpectDraft = async (page: Page, expectedStakeholderCount: number) => {
  const submitButton = await openRegistrationConfirmation(page);
  const createRequest = page.waitForRequest(
    (request) => request.url().includes('/supportmanagement/errand/create') && request.method() === 'POST'
  );
  await submitButton.click();
  const request = await createRequest;
  const response = await request.response();
  expect(response?.status()).toBe(200);
  const body = request.postDataJSON() as CreateErrandRequestBody;
  expect(body.parameters).toContainEqual({ key: 'eventType', values: ['AVVIKELSE'] });
  expect(body.parameters).toContainEqual({ key: 'eventConcerns', values: ['ENSKILD_BRUKARE'] });
  expect(body.jsonParameters).toEqual([
    {
      key: MOCK_FORM_SCHEMA_NAME,
      value: { incidentDescription: MOCK_INCIDENT_DESCRIPTION },
      schemaId: MOCK_FORM_SCHEMA_ID,
    },
  ]);
  expect(body.stakeholders?.length).toBe(expectedStakeholderCount);

  // En inskickad rapport landar på kvittot, inte i det inlämnade ärendets formulär.
  await expect(page).toHaveURL(/\/arende\/inskickad$/);
  await expect(page.getByRole('heading', { name: 'Rapporten är inskickad' })).toBeVisible();
};

const selectRequiredErrandParameters = async (page: Page) => {
  const eventType = page.getByTestId('event-type-deviation');
  const eventConcerns = page.getByTestId('event-concerns-individual');

  await eventType.check();
  await expect(eventType).toBeChecked();
  await eventConcerns.check();
  await expect(eventConcerns).toBeChecked();
  await expect(eventType).toBeChecked();
};

/**
 * Fyller i allt som krävs för att ärendet ska gå att registrera. Alla
 * registreringstester går genom denna, så ett nytt obligatoriskt fält behöver
 * bara läggas till här för att gälla både lyckad och misslyckad registrering.
 */
const completeRequiredErrandForm = async (page: Page) => {
  await selectRequiredErrandParameters(page);

  const incidentDescription = page.getByRole('textbox', { name: /Beskriv händelsen/ });
  await expect(incidentDescription).toBeEditable();
  await incidentDescription.fill(MOCK_INCIDENT_DESCRIPTION);
  await expect(incidentDescription).toHaveValue(MOCK_INCIDENT_DESCRIPTION);
};

test.describe('Register new errand page', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
    await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
    await page.route(`**/schemas/latest/${MOCK_FORM_SCHEMA_NAME}`, jsonRoute(mockFormSchemaResponse));
    await page.route(`**/schemas/${MOCK_FORM_SCHEMA_ID}`, jsonRoute(mockFormSchemaResponse));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.goto(appUrl('/arende/registrera'));

    // Att kontrollerna syns bevisar inte att de serverrenderade radioknapparna
    // har hydrerats. Rapportören läggs till av en klienteffekt, så det är
    // registreringsflödets observerbara readiness-gräns.
    await expect(sectionByTitle(page, 'Rapportör').getByTestId('stakeholder-card')).toHaveCount(1);
  });

  test('Add stakeholders using personnumber and register draft errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await completeRequiredErrandForm(page);

    //Brukare
    const brukare = sectionByTitle(page, 'Enskild brukare');
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    //Övriga parter
    const ovrigaParter = sectionByTitle(page, 'Övriga parter');
    for (const role of ['CONTACT', 'CONTACT']) {
      await addStakeholder(page, ovrigaParter, role);
      await expect(ovrigaParter.getByTestId('edit-card-button')).toHaveCount(0);
      await expect(ovrigaParter.getByTestId('remove-card-button').first()).toBeVisible();
      await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();
    }

    await registerErrandAndExpectDraft(page, 4);
  });

  test('Preserves entered data and stays on the form when registration fails', async ({ page }) => {
    await page.route('**/supportmanagement/errand/create', jsonRoute({ message: 'Upstream unavailable' }, 502));
    await expect(sectionByTitle(page, 'Rapportör').getByTestId('stakeholder-card')).toHaveCount(1);
    await completeRequiredErrandForm(page);
    // En rapport som berör en enskild brukare kräver att brukaren finns, annars stoppas den
    // av valideringen innan anropet som testet vill se misslyckas.
    await addStakeholder(page, sectionByTitle(page, 'Enskild brukare'), 'PRIMARY');

    const submitButton = await openRegistrationConfirmation(page);
    const failedResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/supportmanagement/errand/create') && response.request().method() === 'POST'
    );
    await submitButton.click();
    const response = await failedResponse;
    expect(response.status()).toBe(502);

    await expect(page).toHaveURL(/\/arende\/registrera$/);
    await expect(page.getByTestId('event-type-deviation')).toBeChecked();
    await expect(page.getByTestId('event-concerns-individual')).toBeChecked();
    await expect(page.getByText('Något gick fel när ärendet sparades')).toBeVisible();
    await expect(page.getByText('Ärendet skickades in')).toHaveCount(0);
  });

  test('Manually add stakeholders and register errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await completeRequiredErrandForm(page);

    //Brukare
    const brukare = sectionByTitle(page, 'Enskild brukare');
    await brukare.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(brukare.getByTestId('reporter-card')).toHaveCount(0);
    await brukare.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(brukare.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    //Övriga parter
    const ovrigaParter = sectionByTitle(page, 'Övriga parter');
    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('reporter-card')).toHaveCount(0);
    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await registerErrandAndExpectDraft(page, 3);
  });

  test('Keeps a stakeholder removable without exposing card editing', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await completeRequiredErrandForm(page);

    //Brukare
    const brukare = sectionByTitle(page, 'Enskild brukare');
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);
    await brukare.getByTestId('remove-card-button').dispatchEvent('click');
    await expect(brukare.getByTestId('add-manual-person-button')).toBeVisible();
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    const stakeholderCard = brukare.getByTestId('stakeholder-card');
    // Avsnittet rymmer bara brukaren, så kortet bär ingen rollrad – rubriken säger redan rollen.
    await expect(stakeholderCard.getByTestId('stakeholder-role')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockStakeholder.firstName ?? ''} ${mockStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toContainText(MOCK_HYPHEN_PERSON_NUMBER);
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toContainText(
      `${mockStakeholder.address ?? ''} ${mockStakeholder.city ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    await registerErrandAndExpectDraft(page, 2);
  });

  test('Keeps an employee stakeholder removable without exposing card editing', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await completeRequiredErrandForm(page);

    // Brukaren krävs när rapporten berör en enskild brukare, och räknas med bland parterna.
    await addStakeholder(page, sectionByTitle(page, 'Enskild brukare'), 'PRIMARY');

    //Övriga parter
    const ovrigaParter = sectionByTitle(page, 'Övriga parter');
    await addEmployeeStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();
    await ovrigaParter.getByTestId('remove-card-button').dispatchEvent('click');

    await addEmployeeStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    const stakeholderCard = ovrigaParter.getByTestId('stakeholder-card');
    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Kontaktperson');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockReporterStakeholder.firstName ?? ''} ${mockReporterStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-title')).toContainText(mockReporterStakeholder.title ?? '');
    await expect(stakeholderCard.getByTestId('stakeholder-department')).toContainText(
      mockReporterStakeholder.department ?? ''
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    await registerErrandAndExpectDraft(page, 3);
  });

  test('Reporter information should be displayed', async ({ page }) => {
    const rapportor = sectionByTitle(page, 'Rapportör');
    const stakeholderCard = rapportor.getByTestId('stakeholder-card');
    // Rollraden på kortet upprepade bara avsnittsrubriken och är borttagen där.
    await expect(stakeholderCard.getByTestId('stakeholder-role')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-title')).toContainText(mockReporterStakeholder.title ?? '');
    await expect(stakeholderCard.getByTestId('stakeholder-department')).toContainText(
      mockReporterStakeholder.department ?? ''
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockReporterStakeholder.firstName ?? ''} ${mockReporterStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    // Rapportören är varken redigerbar eller borttagbar från kortet.
    await expect(rapportor.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(rapportor.getByTestId('remove-card-button')).toHaveCount(0);
    await expect(rapportor.getByTestId('add-manual-person-button')).toHaveCount(0);
  });

  test('Sections are ordered with the reporter first and Brukare follows the event scope', async ({ page }) => {
    // Rapportören står först, och brukaren finns inte alls innan händelsen berör en
    // enskild brukare. Uppgifter kring avvikelsen renderas som schemaformulär med egna
    // underrubriker (h3) och ingår därför inte i listan.
    await expect(page.locator('section h2')).toHaveText(['Rapportör', 'Om rapporten', 'Övriga parter']);

    await page.getByTestId('event-concerns-individual').check();
    await expect(page.locator('section h2')).toHaveText([
      'Rapportör',
      'Om rapporten',
      'Enskild brukare',
      'Övriga parter',
    ]);

    await page.getByTestId('event-concerns-group-activity').check();
    await expect(sectionByTitle(page, 'Enskild brukare')).toHaveCount(0);
  });

  test('Event scope offers only the two remaining options and each event type explains itself', async ({ page }) => {
    await expect(page.getByTestId('event-concerns-other')).toHaveCount(0);
    await expect(page.getByTestId('event-concerns-group').getByRole('radio')).toHaveCount(2);

    await expect(
      page.getByText(
        'Rapportören är den person som anmäler händelsen och är kontaktperson för ärendet. Om du rapporterar åt en kollega, markera rutan nedan och ange kollegans uppgifter.'
      )
    ).toBeVisible();

    // Hjälptexten för Om rapporten står före radioknapparna, och båda fälten har sina rubriker
    const aboutDescription = page.getByText('Ange vilken typ av händelse det gäller och vem eller vilka som berörs.');
    await expect(aboutDescription).toBeVisible();
    // Etiketterna matchas via klassen, eftersom obligatoriska fält får en asterisk efter texten
    const formLabels = page.locator('.sk-form-label');
    await expect(formLabels.filter({ hasText: 'Typ av rapport' })).toBeVisible();
    await expect(formLabels.filter({ hasText: 'Vem eller vilka berör rapporten?' })).toBeVisible();

    const aboutDescriptionBox = await aboutDescription.boundingBox();
    const eventTypeGroupBox = await page.getByTestId('event-type-group').boundingBox();
    if (!aboutDescriptionBox || !eventTypeGroupBox) throw new Error('Saknar mått för hjälptext eller radiogrupp');
    expect(aboutDescriptionBox.y).toBeLessThan(eventTypeGroupBox.y);

    // Båda förklaringarna syns samtidigt, så typerna går att jämföra innan valet görs.
    const deviationDescription = page.getByText(
      'Något har inte blivit som det var tänkt eller planerat i verksamheten. Gäller inom alla områden SoL, LSS och HSL.'
    );
    const misconductDescription = page.getByText(
      'En brist eller händelse som medfört allvarlig risk för den enskildes liv, säkerhet och hälsa.'
    );
    await expect(deviationDescription).toBeVisible();
    await expect(misconductDescription).toBeVisible();

    // Designsystemets etikett har fast höjd. Utan höjdöverstyrningen lägger sig
    // alternativens textblock över varandra i stället för att staplas.
    const deviationBox = await deviationDescription.boundingBox();
    const misconductBox = await misconductDescription.boundingBox();
    if (!deviationBox || !misconductBox) throw new Error('Saknar mått för hjälptexterna');
    expect(deviationBox.y + deviationBox.height).toBeLessThanOrEqual(misconductBox.y);
  });

  test('Sections are plain headings without disclosures or icons', async ({ page }) => {
    await page.getByTestId('event-concerns-individual').check();

    // Inga hopfällbara avsnitt kvar, varken de handkodade eller schemaformulärets
    await expect(page.locator('.sk-disclosure')).toHaveCount(0);

    // Rubrikerna är kvar och innehållet syns utan att något behöver fällas ut
    const rapportor = sectionByTitle(page, 'Rapportör');
    await expect(rapportor.getByRole('heading', { name: 'Rapportör', exact: true })).toBeVisible();
    await expect(rapportor.getByTestId('stakeholder-card')).toBeVisible();
    await expect(sectionByTitle(page, 'Enskild brukare').getByTestId('add-manual-person-button')).toBeVisible();

    // Ikonerna satt i disclosure-huvudet; inga svg:er ska ligga kvar bredvid rubrikerna
    await expect(rapportor.locator('h2 svg')).toHaveCount(0);
    await expect(page.locator('section > h2 svg')).toHaveCount(0);
  });

  test('The submitted report page leads back to the overview', async ({ page }) => {
    await completeRequiredErrandForm(page);
    // Brukaren krävs när rapporten berör en enskild brukare, och räknas med bland parterna.
    await addStakeholder(page, sectionByTitle(page, 'Enskild brukare'), 'PRIMARY');
    await registerErrandAndExpectDraft(page, 2);

    await page.getByTestId('back-to-overview').click();

    // Översikten är en egen route som dev-servern kompilerar vid första besöket, och det tar
    // längre tid än standardväntan. Testet gäller att länken leder rätt, inte hur snabbt.
    await expect(page).toHaveURL(/\/oversikt$/, { timeout: 20_000 });
  });

  // TODO: Add test for registering complete errand when frontend functionality is ready
});
