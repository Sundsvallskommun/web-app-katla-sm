import type { Locator, Page } from '@playwright/test';

import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';
import { addStakeholder, sectionByTitle } from '../utils/stakeholder';
import { expect, test } from '../utils/test';

const mockRegistration = async (page: Page) => {
  // Unknown API traffic is blocked. The shared test fixture remains the owner of /api/me.
  await page.route('**/api/**', (route) =>
    new URL(route.request().url()).pathname.endsWith('/api/me') ? route.fallback() : route.abort()
  );
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  const submissions: string[] = [];
  await page.route('**/supportmanagement/errand/create', (route) => {
    submissions.push(route.request().method());
    return route.abort();
  });
  await page.route(
    '**/schemas/**',
    jsonRoute({
      schemaId: 'confirmation-accessibility:1',
      schema: {
        type: 'object',
        properties: { incidentDescription: { type: 'string', title: 'Beskriv händelsen', minLength: 1 } },
        required: ['incidentDescription'],
      },
      uiSchema: {},
    })
  );
  return submissions;
};

const crossModalTabBoundary = async (page: Page, key: 'Tab' | 'Shift+Tab') => {
  await page.keyboard.press(key);
  // Native dialogs may include browser chrome in navigation, never background page controls.
  if (!(await page.evaluate(() => document.hasFocus()))) await page.keyboard.press(key);
};

const expectConfirmationModality = async (page: Page, dialog: Locator, first: Locator, last: Locator) => {
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(first).toBeFocused();
  // aria-modal alone is not proof of an inert background: this regressed in the DS Dialog.
  await page
    .getByTestId('language-switch-button')
    .filter({ visible: true })
    .evaluate((element) => {
      element.focus();
    });
  await expect(first).toBeFocused();
  await first.press('Tab');
  await expect(last).toBeFocused();
  await crossModalTabBoundary(page, 'Tab');
  await expect(first).toBeFocused();
  await crossModalTabBoundary(page, 'Shift+Tab');
  await expect(last).toBeFocused();
  await last.press('Shift+Tab');
  await expect(first).toBeFocused();
};

const expectCenteredDialog = async (page: Page, dialog: Locator) => {
  const viewport = page.viewportSize();
  const bounds = await dialog.boundingBox();
  if (!viewport || !bounds) throw new Error('The confirmation must be visible before checking its geometry.');
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  expect(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
  expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  // The backdrop is inert but does not dismiss a confirmation.
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
};

const expectWithinWidth = async (locator: Locator, width: number) => {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('The login content must be visible before measuring reflow.');
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  const overflow = await locator.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
};

test.describe('Login reflow', () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const locale of ['sv', 'en']) {
    for (const textScale of [1, 2]) {
      for (const loggedOut of [false, true]) {
        test(`Fits ${locale} login at 320px with ${textScale * 100}% text (logged out: ${loggedOut})`, async ({
          appUrl,
          page,
        }) => {
          // No SSO can run, even if a later test change accidentally activates the button.
          await page.route('**/saml/**', (route) => route.abort());
          const prefix = locale === 'sv' ? '' : '/en';
          await page.goto(appUrl(`${prefix}/login${loggedOut ? '?loggedout' : ''}`));
          const main = page.getByRole('main');
          const button = main.getByRole('button');
          await expect(button).toBeVisible();
          await page.evaluate(async (scale) => {
            await document.fonts.ready;
            const root = document.documentElement;
            root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
            await document.fonts.ready;
          }, textScale);

          await expectWithinWidth(main, 320);
          await expectWithinWidth(main.getByRole('heading', { level: 1 }), 320);
          await expectWithinWidth(button, 320);
          if (!loggedOut) {
            await expectWithinWidth(
              main.getByText(locale === 'sv' ? /Har du problem med inloggning/ : /If you have problems logging in/),
              320
            );
          }
        });
      }
    }
  }
});

test.describe('Cancellation dialog', () => {
  for (const { width, locale } of [
    { width: 1536, locale: 'sv' },
    { width: 390, locale: 'sv' },
    { width: 320, locale: 'sv' },
    { width: 320, locale: 'en' },
  ]) {
    test(`Is named, truly modal and restores focus at ${width}px in ${locale}`, async ({ appUrl, page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      const submissions = await mockRegistration(page);
      await page.goto(appUrl(`${locale === 'sv' ? '' : '/en'}/arende/registrera`));
      await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
      const cancel = page.getByRole('button', { name: locale === 'sv' ? 'Avbryt' : 'Cancel', exact: true });
      const title = locale === 'sv' ? 'Avbryt rapport' : 'Cancel report';
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      const closedDialog = page.getByRole('dialog', { name: title, exact: true, includeHidden: true });
      const back = dialog.getByRole('button', { name: locale === 'sv' ? 'Nej, fortsätt' : 'No, continue' });
      const confirm = dialog.getByRole('button', { name: locale === 'sv' ? 'Ja, avbryt' : 'Yes, cancel' });
      await expect(closedDialog).not.toBeVisible();
      // The mobile bottom bar can overlap the development indicator; activate the real keyboard control.
      await cancel.focus();
      await cancel.press('Enter');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
      await expectConfirmationModality(page, dialog, back, confirm);
      await expectCenteredDialog(page, dialog);
      await page.screenshot({ path: testInfo.outputPath('cancellation-dialog.png') });
      await page.keyboard.press('Escape');
      await expect(closedDialog).not.toBeVisible();
      await expect(page.locator('dialog:modal')).toHaveCount(0);
      await expect(cancel).toBeFocused();

      await cancel.press('Enter');
      await expectConfirmationModality(page, dialog, back, confirm);
      await back.press('Enter');
      await expect(closedDialog).not.toBeVisible();
      await expect(page.locator('dialog:modal')).toHaveCount(0);
      await expect(cancel).toBeFocused();
      await page.getByTestId('language-switch-button').filter({ visible: true }).focus();
      await expect(page.getByTestId('language-switch-button').filter({ visible: true })).toBeFocused();
      await expect(page).toHaveURL(/\/arende\/registrera$/);
      expect(submissions).toEqual([]);
    });
  }
});

test.describe('Submission confirmation', () => {
  for (const width of [1536, 390, 320]) {
    test(`Keeps the ${width}px registration confirmation modal without submitting a report`, async ({
      appUrl,
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      const submissions = await mockRegistration(page);
      await page.goto(appUrl('/arende/registrera'));
      await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
      const next = page.getByRole('button', { name: 'Nästa', exact: true });
      if (width < 800) await next.click();
      await page.getByTestId('event-type-deviation').check();
      await page.getByTestId('event-concerns-individual').check();
      if (width < 800) await next.click();
      // The wizard renders a single step in main; desktop wraps each section separately.
      const userSection = width < 800 ? page.getByRole('main') : sectionByTitle(page, 'Enskild brukare');
      await addStakeholder(page, userSection, 'PRIMARY');
      if (width < 800) await next.click();
      await page.getByRole('textbox', { name: /Beskriv händelsen/ }).fill('Händelse i tillgänglighetstest.');
      if (width < 800) await next.click();

      const trigger =
        width < 800 ? page.getByRole('button', { name: 'Skicka', exact: true }) : page.getByTestId('register-errand');
      const title = 'Skicka rapporten?';
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      const closedDialog = page.getByRole('dialog', { name: title, exact: true, includeHidden: true });
      const back = dialog.getByRole('button', { name: 'Avbryt', exact: true });
      const submit = dialog.getByRole('button', { name: 'Skicka rapport', exact: true });
      await expect(closedDialog).not.toBeVisible();
      await trigger.focus();
      await trigger.press('Enter');
      await expect(dialog.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
      await expectConfirmationModality(page, dialog, back, submit);
      await expectCenteredDialog(page, dialog);
      await page.screenshot({ path: testInfo.outputPath('submission-dialog.png') });
      await page.keyboard.press('Escape');
      await expect(closedDialog).not.toBeVisible();
      await expect(page.locator('dialog:modal')).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.press('Enter');
      await expectConfirmationModality(page, dialog, back, submit);
      await back.press('Enter');
      await expect(closedDialog).not.toBeVisible();
      await expect(page.locator('dialog:modal')).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page).toHaveURL(/\/arende\/registrera$/);
      expect(submissions).toEqual([]);
    });
  }
});
