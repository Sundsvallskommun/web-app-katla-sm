import type { Locator, Page, Route } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadataWithPlaceStructure } from '../fixtures/mockMetadata';
import {
  USER_GUIDE_EVENT_DATE,
  USER_GUIDE_EVENT_DESCRIPTION,
  USER_GUIDE_USER_EMAIL,
  userGuideCareRecipient,
  userGuideErrands,
  userGuideFormSchema,
  userGuideFormSchemaId,
  userGuideFormSchemaName,
  userGuideMe,
  userGuideReporter,
} from '../fixtures/mockUserGuide';
import { MOCK_HYPHEN_PERSON_NUMBER, MOCK_PHONE_NUMBER } from '../utils/constants';
import { selectFacility } from '../utils/registration';
import { jsonRoute } from '../utils/routes';
import { sectionByTitle, syntheticClick } from '../utils/stakeholder';
import { expect, test } from '../utils/test';
import { centerInView, contentOf, UPDATE_USER_GUIDE, UserGuideRecorder } from '../utils/user-guide-recorder';

/**
 * Användarguidens skärmbilder (/hjalp). Testet går igenom hela registreringen som en användare
 * gör och fotograferar varje steg som guiden visar.
 *
 * - `yarn generate:user-guide` skriver bilderna till public/user-guide/ och manifestet med
 *   elementens lägen till src/components/user-guide/generated/.
 * - I den vanliga e2e-körningen skrivs ingenting, men varje utpekat element måste finnas och
 *   synas. Ändras flödet så att guiden inte längre stämmer faller testet – uppdatera då guiden
 *   enligt AGENTS.md i repots rot.
 */

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
/** Formuläret fotograferas i ett högt fönster, så att även det längsta avsnittet ryms i en bild. */
const DESKTOP_FORM_VIEWPORT = { width: 1280, height: 2000 };
const PHONE_VIEWPORT = { width: 390, height: 844 };

/** Luft till vänster om korten, så att pilarna mot fält i full bredd får plats i marginalen. */
const ARROW_ROOM_LEFT = { left: 72 };
/** Luft under formulärets rubrikrad, så att bilden visar att det är formulärets överkant. */
const ACTION_ROW_CONTEXT = 160;

const OVERVIEW_COUNTS: Record<string, number> = { NEW: userGuideErrands.totalElements ?? 0, DRAFT: 0, SOLVED: 2 };

const recorder = new UserGuideRecorder();

const respondWithCount = (route: Route) => {
  const status = new URL(route.request().url()).searchParams.get('status') ?? '';
  return jsonRoute({ count: OVERVIEW_COUNTS[status] ?? 0 })(route);
};

const mockUserGuideApi = async (page: Page) => {
  await page.route('**/api/me', jsonRoute(userGuideMe));
  await page.route((url) => url.pathname.endsWith('/supportmanagement/errands'), jsonRoute(userGuideErrands));
  await page.route((url) => url.pathname.endsWith('/supportmanagement/count'), respondWithCount);
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadataWithPlaceStructure));
  await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
  await page.route('**/employee/personal/*', jsonRoute(userGuideReporter));
  await page.route('**/employee/employments', jsonRoute([]));
  await page.route('**/citizen/person/*', jsonRoute({ ...userGuideCareRecipient, role: 'PRIMARY' }));
  await page.route(`**/schemas/latest/${userGuideFormSchemaName}`, jsonRoute(userGuideFormSchema));
  await page.route(`**/schemas/${userGuideFormSchemaId}`, jsonRoute(userGuideFormSchema));
};

/** Söker fram brukaren och fyller i kontaktuppgifterna, men lägger inte till personen än. */
const searchCareRecipient = async (page: Page, scope: Locator) => {
  await scope.getByTestId('person-number-input').fill(MOCK_HYPHEN_PERSON_NUMBER);
  const personResponse = page.waitForResponse('**/citizen/person/*');
  await syntheticClick(scope.locator('button', { hasText: 'Sök' }));
  await personResponse;
  await expect(scope.getByTestId('search-result')).toBeVisible();
  await scope.getByTestId('stakeholder-email-input').fill(USER_GUIDE_USER_EMAIL);
  await scope.getByTestId('stakeholder-mobilephone-input').fill(MOCK_PHONE_NUMBER);
};

const addCareRecipient = async (scope: Locator) => {
  await syntheticClick(scope.getByTestId('add-stakeholder-button'));
  await expect(scope.getByTestId('stakeholder-card')).toHaveCount(1);
};

/** Platsen väljs sist: se selectFacility. */
const describeEvent = async (page: Page) => {
  await page.locator('#root_eventDate').fill(USER_GUIDE_EVENT_DATE);
  await page.locator('#root_eventDescription').fill(USER_GUIDE_EVENT_DESCRIPTION);
  await selectFacility(page);
};

test.describe('User guide screenshots', () => {
  test.describe.configure({ mode: 'serial' });
  // Bilderna tas med dubbel upplösning så att texten i dem är skarp även på högupplösta skärmar.
  test.use({ deviceScaleFactor: UPDATE_USER_GUIDE ? 2 : 1 });

  test.beforeEach(async ({ page }) => {
    await mockUserGuideApi(page);
  });

  test.afterAll(async () => {
    if (UPDATE_USER_GUIDE && recorder.isComplete()) {
      await recorder.writeManifest();
    }
  });

  test('Walks through reporting a deviation on a computer', async ({ appUrl, page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(appUrl('/oversikt'));
    const newReportButton = page.getByTestId('overview-aside').getByTestId('register-new-errand-button');
    // Dev-servern kompilerar sidan vid första besöket, vilket tar längre tid än standardväntan.
    await expect(page.getByTestId('errand-table').locator('.sk-table-tbody-tr')).toHaveCount(
      userGuideErrands.content?.length ?? 0,
      { timeout: 30_000 }
    );
    await recorder.capture(page, 'overview', {
      area: 'viewport',
      targets: { 'new-report-button': newReportButton },
    });

    await page.setViewportSize(DESKTOP_FORM_VIEWPORT);
    await newReportButton.click();
    await expect(page).toHaveURL(/\/arende\/registrera$/, { timeout: 20_000 });
    const reporter = sectionByTitle(page, 'Rapportör');
    await expect(reporter.getByTestId('stakeholder-card')).toHaveCount(1);

    // Felsammanfattningen fotograferas på det tomma formuläret, som sedan laddas om. Annars
    // skulle sammanfattningen stå kvar överst i de följande bilderna.
    await page.getByTestId('register-errand').click();
    const errorSummary = page.getByTestId('errand-error-summary');
    await expect(errorSummary).toBeVisible();
    await centerInView(errorSummary);
    await recorder.capture(page, 'error-summary', {
      area: errorSummary,
      targets: {
        summary: contentOf(errorSummary.getByRole('heading')),
        'summary-link': errorSummary.getByTestId('errand-error-summary-link').first(),
      },
    });
    await page.reload();
    await expect(reporter.getByTestId('stakeholder-card')).toHaveCount(1);

    await centerInView(reporter);
    await recorder.capture(page, 'reporter', {
      area: reporter,
      padding: ARROW_ROOM_LEFT,
      targets: {
        'reporter-card': reporter.getByTestId('stakeholder-card'),
        'colleague-checkbox': contentOf(reporter.locator('label.sk-form-checkbox-label-wrapper')),
      },
    });

    const about = sectionByTitle(page, 'Om rapporten');
    await about.getByTestId('event-type-deviation').check();
    await about.getByTestId('event-concerns-individual').check();
    await centerInView(about);
    await recorder.capture(page, 'about', {
      area: about,
      targets: {
        'event-type': about.getByTestId('event-type-group'),
        'event-concerns': about.getByTestId('event-concerns-group'),
      },
    });

    const careRecipient = sectionByTitle(page, 'Enskild brukare');
    await searchCareRecipient(page, careRecipient);
    await centerInView(careRecipient);
    await recorder.capture(page, 'user', {
      area: careRecipient,
      targets: {
        'person-search': careRecipient.locator('.sk-search-field'),
        'add-person': careRecipient.getByTestId('add-stakeholder-button'),
        'add-manually': careRecipient.getByTestId('add-manual-person-button'),
      },
    });
    await addCareRecipient(careRecipient);

    const otherParties = sectionByTitle(page, 'Övriga parter');
    await centerInView(otherParties);
    await recorder.capture(page, 'other-parties', {
      area: otherParties,
      targets: {
        'search-type': contentOf(otherParties.locator('.sk-form-radio-group')),
        'party-search': otherParties.locator('.sk-search-field'),
      },
    });

    await describeEvent(page);
    // Schemaformuläret är tre kort. Varje kort blir en egen bild, med plats till vänster om
    // fälten för pilarna.
    const place = sectionByTitle(page, 'Plats');
    await centerInView(place);
    await recorder.capture(page, 'deviation-place', {
      area: place,
      targets: { facility: page.getByTestId('facility-search') },
    });
    const times = sectionByTitle(page, 'Tidpunkter');
    await centerInView(times);
    await recorder.capture(page, 'deviation-time', {
      area: times,
      padding: ARROW_ROOM_LEFT,
      targets: { 'event-date': page.locator('#root_eventDate'), 'occurred-date': page.locator('#root_occurredDate') },
    });
    const description = sectionByTitle(page, 'Beskrivning av händelse');
    await centerInView(description);
    await recorder.capture(page, 'deviation-description', {
      area: description,
      padding: ARROW_ROOM_LEFT,
      targets: {
        'event-description': page.locator('#root_eventDescription'),
        'actions-taken': page.locator('#root_actionsTaken'),
      },
    });

    // Rubrikraden med knapparna, fotograferad överst på sidan med sidhuvudet ovanför och
    // formulärets början under.
    const actionRow = page.locator('div.sticky').filter({ has: page.getByRole('heading', { level: 1 }) });
    await actionRow.evaluate((element) => {
      element.closest('.overflow-y-auto')?.scrollTo({ top: 0 });
    });
    const actionRowBox = await actionRow.boundingBox();
    if (!actionRowBox) throw new Error('Formulärets rubrikrad syns inte.');
    await recorder.capture(page, 'submit', {
      area: {
        x: 0,
        y: 0,
        width: DESKTOP_FORM_VIEWPORT.width,
        height: actionRowBox.y + actionRowBox.height + ACTION_ROW_CONTEXT,
      },
      targets: {
        'cancel-button': actionRow.getByRole('button', { name: 'Avbryt' }),
        'submit-button': actionRow.getByTestId('register-errand'),
      },
    });

    await actionRow.getByTestId('register-errand').click();
    const confirmDialog = page.getByRole('dialog').filter({ has: page.getByTestId('submit-button') });
    await expect(confirmDialog).toBeVisible();
    await recorder.capture(page, 'confirm', {
      area: confirmDialog,
      // Dialogen fotograferas utan omgivning: bakom den skymtar annars avklippta textrader.
      padding: 0,
      targets: { 'confirm-button': confirmDialog.getByTestId('submit-button') },
    });

    await confirmDialog.getByTestId('submit-button').click();
    // Kvittot är en egen route som dev-servern kompilerar vid första besöket.
    await expect(page).toHaveURL(/\/arende\/inskickad$/, { timeout: 30_000 });
    const receiptHeading = page.getByRole('heading', { name: 'Rapporten är inskickad' });
    const backToOverview = page.getByTestId('back-to-overview');
    const receipt = page.locator('div').filter({ has: receiptHeading }).filter({ has: backToOverview }).last();
    await recorder.capture(page, 'submitted', {
      area: receipt,
      targets: { receipt: contentOf(receiptHeading), 'back-to-overview': backToOverview },
    });
  });

  test('Walks through reporting a deviation on a phone', async ({ appUrl, page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto(appUrl('/arende/registrera'));
    await expect(page.getByTestId('stakeholder-card')).toHaveCount(1, { timeout: 30_000 });

    const nextButton = page.getByRole('button', { name: 'Nästa' });
    await recorder.capture(page, 'mobile-step', {
      area: 'viewport',
      targets: { 'step-indicator': contentOf(page.getByText(/^Steg \d+\/\d+$/)), 'next-button': nextButton },
    });
    await nextButton.click();

    await page.getByTestId('event-type-deviation').check();
    await page.getByTestId('event-concerns-individual').check();
    await nextButton.click();

    const careRecipient = page.locator('main');
    await searchCareRecipient(page, careRecipient);
    await addCareRecipient(careRecipient);
    await nextButton.click();

    await describeEvent(page);
    await nextButton.click();

    const summaryHeading = page.getByRole('heading', { name: 'Sammanfattning' });
    await expect(summaryHeading).toBeVisible();
    await recorder.capture(page, 'mobile-summary', {
      area: 'viewport',
      targets: {
        summary: summaryHeading.locator('xpath=..'),
        'submit-button': page.getByRole('button', { name: 'Skicka', exact: true }),
      },
    });
  });
});
