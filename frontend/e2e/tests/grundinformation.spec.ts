import type { Locator, Page } from '@playwright/test';
import axe from 'axe-core';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const MOBILE_VIEWPORT = { width: 431, height: 932 };
const DESKTOP_VIEWPORT = { width: 1536, height: 960 };

// Långa titlar, enhetsnamn och e-postadresser är normalfallet i verksamheten.
// En e-postadress saknar mellanslag och sätter därför kortets min-content-bredd
// om den inte tillåts brytas.
const longReporter = {
  ...mockReporterStakeholder,
  firstName: 'Ulrika',
  lastName: 'Wiklund',
  title: 'Specialistundersköterska',
  department: 'VOF HOS Korttidsboende 1',
  emails: ['ulrika.wiklund@example.com'],
  phoneNumbers: [MOCK_COUNTRY_CODE_PHONE_NUMBER],
};

const errandPath = `/arende/${mockErrand.errandNumber}/grundinformation`;

// boundingBox() ger null för element som inte är synliga. Utan den här kontrollen
// skulle ett omätbart element tysta ned jämförelserna nedan till 0 <= 0 i stället
// för att fälla testet.
const measure = async (locator: Locator, name: string) => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error(`Kunde inte mäta ${name} — elementet är inte synligt`);
  }
  return { ...box, right: box.x + box.width };
};

/** mockErrand har status NEW, alltså ett inlämnat ärende. */
const openErrand = async (page: Page, appUrl: (path: string) => string, status?: string) => {
  await page.route(
    `**/supportmanagement/errand/${mockErrand.errandNumber}`,
    jsonRoute({ ...mockErrand, stakeholders: [longReporter], ...(status === undefined ? {} : { status }) })
  );
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.goto(appUrl(errandPath));
};

const openReporterCard = async (page: Page, appUrl: (path: string) => string) => {
  await openErrand(page, appUrl);

  const card = page.getByTestId('stakeholder-card').first();
  await expect(card).toBeVisible();
  return card;
};

test.describe('Errand basic information page', () => {
  test('Reporter card keeps long contact details inside its own bounds on mobile', async ({
    appUrl,
    page,
  }, testInfo) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const card = await openReporterCard(page, appUrl);

    const cardBox = await measure(card, 'stakeholder-card');
    const emailBox = await measure(card.getByTestId('stakeholder-email'), 'stakeholder-email');
    const departmentBox = await measure(card.getByTestId('stakeholder-department'), 'stakeholder-department');
    const cardOverflow = await card.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));

    expect(cardOverflow.scrollWidth).toBeLessThanOrEqual(cardOverflow.clientWidth);
    expect(emailBox.right).toBeLessThanOrEqual(cardBox.right);
    expect(departmentBox.right).toBeLessThanOrEqual(cardBox.right);
    // Kontrollera både radens egen bredd och viewporten så att text inte kan
    // hamna utanför en förälder som klipper horisontell overflow.
    expect(emailBox.right).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    expect(cardBox.right).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    await card.getByRole('link', { name: longReporter.emails[0] }).click({ trial: true });
    await page.addScriptTag({ content: axe.source });
    const audit = await page.evaluate(() =>
      window.axe.run('[data-cy="stakeholder-card"]', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      })
    );
    expect(audit.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('person-profile-431.png') });
  });

  test('Reporter groups identity and exposes contact links on desktop', async ({ appUrl, page }, testInfo) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    const card = await openReporterCard(page, appUrl);

    const departmentBox = await measure(card.getByTestId('stakeholder-department'), 'stakeholder-department');
    const emailBox = await measure(card.getByTestId('stakeholder-email'), 'stakeholder-email');
    const cardOverflow = await card.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));

    const nameBox = await measure(card.getByTestId('stakeholder-name'), 'stakeholder-name');
    const titleBox = await measure(card.getByTestId('stakeholder-title'), 'stakeholder-title');
    expect(titleBox.x).toBe(nameBox.x);
    expect(departmentBox.x).toBeGreaterThan(titleBox.x);
    await expect(card.getByRole('link', { name: longReporter.emails[0] })).toHaveAttribute(
      'href',
      `mailto:${encodeURIComponent(longReporter.emails[0])}`
    );
    await card.getByRole('link', { name: longReporter.emails[0] }).click({ trial: true });
    const phone = card.getByRole('link', { name: MOCK_COUNTRY_CODE_PHONE_NUMBER, exact: true });
    await expect(phone).toHaveAttribute('href', `tel:${MOCK_COUNTRY_CODE_PHONE_NUMBER}`);
    await expect(phone).toHaveAttribute('aria-disabled', 'false');
    await phone.click({ trial: true });
    await card.getByRole('link', { name: longReporter.emails[0] }).focus();
    await page.keyboard.press('Tab');
    await expect(phone).toBeFocused();
    await expect(phone).toHaveCSS('outline-style', 'solid');
    await expect(card).toHaveCSS('outline-width', '0px');
    expect(emailBox.y).toBeGreaterThan(departmentBox.y);
    expect(cardOverflow.scrollWidth).toBeLessThanOrEqual(cardOverflow.clientWidth);
    await page.addScriptTag({ content: axe.source });
    const audit = await page.evaluate(() =>
      window.axe.run('[data-cy="stakeholder-card"]', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      })
    );
    expect(audit.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('person-profile-1536.png') });
  });

  test('Submitted errand omits editing actions and says why', async ({ appUrl, page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const card = await openReporterCard(page, appUrl);

    await expect(page.getByTestId('read-only-notice')).toBeVisible();
    // En nedtonad men synlig kontroll läser som att något är trasigt. Alla
    // redigeringsytor ska utebli, inte bara kortets egna knappar.
    await expect(card.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(card.getByTestId('remove-card-button')).toHaveCount(0);
    await expect(page.getByTestId('person-number-input')).toHaveCount(0);
    await expect(page.getByTestId('add-manual-person-button')).toHaveCount(0);
  });

  test('Draft errand resumes in the wizard on mobile', async ({ appUrl, page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openErrand(page, appUrl, 'DRAFT');

    // Wizardens stegindikator finns bara i wizardvyn, aldrig i flikvyn.
    await expect(page.getByText(/^Steg 1\/\d+$/)).toBeVisible();
    await expect(page.getByTestId('read-only-notice')).toHaveCount(0);
  });

  test('Draft errand still uses the tab layout on desktop', async ({ appUrl, page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openErrand(page, appUrl, 'DRAFT');

    await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
    await expect(page.getByText(/^Steg 1\/\d+$/)).toHaveCount(0);
    // Utkastets formulär är redigerbart, men stakeholder-korten har ingen separat redigeringsåtgärd.
    await expect(page.getByTestId('edit-card-button')).toHaveCount(0);
    await expect(page.getByTestId('person-number-input').first()).toBeVisible();
  });
});
