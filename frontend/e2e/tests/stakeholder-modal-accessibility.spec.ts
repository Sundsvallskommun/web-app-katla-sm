import type { Page } from '@playwright/test';

import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const crossModalBoundary = async (page: Page, key: 'Tab' | 'Shift+Tab') => {
  await page.keyboard.press(key);
  // Native dialogs may visit browser chrome, but the next document focus must stay modal.
  if (!(await page.evaluate(() => document.hasFocus()))) await page.keyboard.press(key);
};

test.describe('Manual stakeholder modal accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.route('**/supportmanagement/notifications', jsonRoute([]));
    await page.route('**/supportmanagement/errand/create', (route) => route.abort());
    await page.route('**/schemas/**', jsonRoute({ schemaId: 'stakeholder-modal:1', schema: { type: 'object' } }));
  });

  for (const locale of ['sv', 'en']) {
    for (const width of [320, 390, 1536]) {
      test(`Keeps the ${locale} person form modal, usable and centered at ${width}px`, async ({ appUrl, page }) => {
        const viewport = { width, height: width < 768 ? 844 : 960 };
        await page.setViewportSize(viewport);
        await page.goto(appUrl(`${locale === 'en' ? '/en' : ''}/arende/registrera`));
        await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
        // Other parties is the last manual-entry action in both the desktop form and reporter wizard step.
        const trigger = page.getByTestId('add-manual-person-button').filter({ visible: true }).last();
        const backgroundLanguage = page.getByTestId('language-switch-button').filter({ visible: true });
        const title = locale === 'sv' ? 'Lägg till person manuellt' : 'Add person manually';
        const closeLabel = locale === 'sv' ? 'Stäng' : 'Close';
        const dialog = page.getByRole('dialog', { name: title, exact: true });
        const close = dialog.getByRole('button', { name: closeLabel, exact: true });
        const save = dialog.getByTestId('modal-add-person-button');
        const firstName = dialog.getByTestId('modal-firstName-input');

        await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
        await trigger.focus();
        await trigger.press('Enter');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
        await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
        await expect(close).toBeFocused();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
        await backgroundLanguage.evaluate((element) => {
          element.focus();
        });
        await expect(close).toBeFocused();
        await close.press('Tab');
        await expect(firstName).toBeFocused();
        await save.focus();
        await crossModalBoundary(page, 'Tab');
        await expect(close).toBeFocused();
        await crossModalBoundary(page, 'Shift+Tab');
        await expect(save).toBeFocused();

        await page.evaluate(() => document.fonts.ready);
        const bounds = await dialog.boundingBox();
        if (!bounds) throw new Error('The modal must be visible before measuring its viewport bounds.');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
        expect(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
        expect(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
        expect(await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
        for (const control of await dialog.locator('button, input, select').filter({ visible: true }).all()) {
          await control.scrollIntoViewIfNeeded();
          const box = await control.boundingBox();
          if (!box) throw new Error('Every person-form control must be visible.');
          expect(box.x).toBeGreaterThanOrEqual(bounds.x);
          expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width);
          expect(box.y).toBeGreaterThanOrEqual(bounds.y);
          expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
        }

        await page.keyboard.press('Escape');
        await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(page.locator('dialog:modal')).toHaveCount(0);

        await trigger.press('Enter');
        await expect(close).toBeFocused();
        await close.press('Enter');
        await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
        await expect(trigger).toBeFocused();

        await trigger.press('Enter');
        await expect(close).toBeFocused();
        await firstName.fill('Kasserat');
        await dialog.getByTestId('modal-cancel-person-button').click();
        await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
        await expect(trigger).toBeFocused();

        await trigger.press('Enter');
        await expect(close).toBeFocused();
        await expect(firstName).toHaveValue('');
        await save.click();
        await expect(firstName).toHaveAttribute('aria-invalid', 'true');
        await expect(firstName).toHaveAccessibleDescription(/.+/);
        await expect(dialog.getByTestId('modal-lastName-input')).toHaveAttribute('aria-invalid', 'true');
        await firstName.fill('Modaltest');
        await dialog.getByTestId('modal-lastName-input').fill('Testsson');
        await save.click();
        await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
        await expect(
          page.getByTestId('stakeholder-card').filter({ hasText: 'Modaltest Testsson' }).first()
        ).toBeVisible();
        await expect(page.locator('dialog:modal')).toHaveCount(0);
      });
    }
  }
});
