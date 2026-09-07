import type { NotificationDTO } from '@data-contracts/backend/data-contracts';
import type { Page } from '@playwright/test';

import { mockErrands } from '../fixtures/mockErrands';
import { mockMetadata } from '../fixtures/mockMetadata';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const notifications: NotificationDTO[] = [
  {
    id: 'overlay-accessibility-notification',
    errandNumber: 'AIA-25120019',
    description: 'Rapport uppdaterad',
    created: '2026-09-04T08:00:00Z',
    acknowledged: false,
  },
];

const crossModalTabBoundary = async (page: Page, key: 'Tab' | 'Shift+Tab') => {
  await page.keyboard.press(key);
  // Native modal navigation may include browser chrome, but never background page controls.
  // Continue from browser chrome so the assertion below tests the next in-document focus.
  if (!(await page.evaluate(() => document.hasFocus()))) await page.keyboard.press(key);
};

test.describe('Modal overlay accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/supportmanagement/errands?*', jsonRoute(mockErrands));
    await page.route('**/supportmanagement/count?*', jsonRoute({ count: mockErrands.totalElements }));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    // Also intercepts any accidental acknowledgement; no notification request reaches a real API.
    await page.route('**/supportmanagement/notifications', jsonRoute(notifications));
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`Keeps notification focus inside the panel at ${viewport.width} CSS pixels`, async ({ appUrl, page }) => {
      await page.setViewportSize(viewport);
      await page.goto(appUrl('/oversikt'));
      // Ignore the other breakpoint's hidden header copy when checking restoration.
      const trigger = page
        .getByRole('button', { name: /Öppna notifieringar/, includeHidden: true })
        .filter({ visible: true });
      await expect(page.getByRole('dialog', { name: 'Notifieringar', exact: true })).not.toBeVisible();
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Notifieringar', exact: true });
      const close = dialog.getByRole('button', { name: 'Stäng notifieringar' });
      const notificationLink = dialog.getByRole('link', { name: 'AIA-25120019' });

      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(close).toBeFocused();
      await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      // Native modal inertness does not add an inert attribute. A background control
      // must instead be unable to take focus, even when focus() is requested directly.
      await trigger.evaluate((element) => {
        element.focus();
      });
      await expect(close).toBeFocused();
      await close.press('Tab');
      await expect(notificationLink).toBeFocused();

      const first = close;
      await crossModalTabBoundary(page, 'Tab');
      await expect(first).toBeFocused();
      await crossModalTabBoundary(page, 'Shift+Tab');
      await expect(notificationLink).toBeFocused();

      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      if (!bounds) throw new Error('The notification panel must be visible.');
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      if (viewport.width < 800) expect(bounds).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
      else {
        await page.mouse.click(16, viewport.height / 2);
        await expect(dialog).toBeVisible();
        await expect.poll(() => dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      }

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Notifieringar', exact: true })).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => page.locator('dialog:modal').count()).toBe(0);

      await trigger.press('Enter');
      await expect(close).toBeFocused();
      await close.press('Enter');
      await expect(dialog).not.toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Notifieringar', exact: true })).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });
  }

  test('keeps account actions keyboard reachable on mobile and restores focus on Escape', async ({ appUrl, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl('/oversikt'));
    const trigger = page.getByRole('button', { name: 'Öppna användarmeny', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const menu = page.getByRole('menu').filter({ visible: true }).first();
    await expect(menu).toBeVisible();
    const logout = menu.getByRole('menuitem', { name: 'Logga ut' });
    await logout.focus();
    await expect(logout).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('radiogroup', { name: 'Ärendefilter' })).toBeVisible();
  });
});
