import type { Locator } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const measure = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('A visible header element is required for the layout check.');
  return { ...bounds, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
};

/** Check what is actually painted above the element, not just its CSS visibility. */
const isUnobscured = (locator: Locator) =>
  locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [0.2, 0.5, 0.8].every((x) =>
      [0.2, 0.5, 0.8].every((y) =>
        element.contains(document.elementFromPoint(bounds.x + bounds.width * x, bounds.y + bounds.height * y))
      )
    );
  });

/** WCAG relative luminance, including translucent button surfaces over the header. */
const textContrast = (locator: Locator) =>
  locator.evaluate(async (element) => {
    await new Promise<number>(requestAnimationFrame);
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    type Color = [number, number, number, number];
    const parseColor = (value: string): Color => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new Error(`Cannot measure color ${value}`);
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const composite = (foreground: Color, background: Color): Color => [
      foreground[0] * foreground[3] + background[0] * (1 - foreground[3]),
      foreground[1] * foreground[3] + background[1] * (1 - foreground[3]),
      foreground[2] * foreground[3] + background[2] * (1 - foreground[3]),
      1,
    ];
    const luminance = (color: Color) => {
      const linear = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };

    const backgrounds: Color[] = [];
    let ancestor: Element | null = element;
    while (ancestor) {
      const style = getComputedStyle(ancestor);
      if (style.backgroundImage !== 'none') throw new Error('An image background requires a visual contrast review.');
      backgrounds.unshift(parseColor(style.backgroundColor));
      ancestor = ancestor.parentElement;
    }
    const background = backgrounds.reduce((result, layer) => composite(layer, result), [255, 255, 255, 1]);
    const foreground = composite(parseColor(getComputedStyle(element).color), background);
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    return (lighter + 0.05) / (darker + 0.05);
  });

test.describe('Shared errand header accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, jsonRoute(mockErrand));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.route('**/supportmanagement/notifications', jsonRoute([]));
    await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
    await page.route(`**/supportmanagement/errand/${mockErrand.id}/conversations**`, jsonRoute([]));
  });

  for (const locale of ['sv', 'en']) {
    for (const width of [320, 1536]) {
      test(`Keeps the ${locale} case context and controls inside the header at ${width} CSS pixels`, async ({
        appUrl,
        page,
      }) => {
        await page.setViewportSize({ width, height: 960 });
        const prefix = locale === 'en' ? '/en' : '';
        await page.goto(appUrl(`${prefix}/arende/${mockErrand.errandNumber}/meddelanden`));
        await expect(page.getByTestId('message-composer')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        // Closed native dialogs keep their own header in the DOM; measure the painted app header.
        const header = page.locator('.sk-header').filter({ visible: true });
        await expect(header).toHaveCount(1);
        const context = header.getByText(mockErrand.errandNumber ?? '', { exact: true });
        const headerBounds = await measure(header);
        const controls = header.getByRole('button').filter({ visible: true });
        expect(await controls.count()).toBeGreaterThanOrEqual(3);

        const links = header.getByRole('link').filter({ visible: true });
        const caseStatus = header.locator('.sk-label');
        await expect(caseStatus).toBeVisible();
        for (const element of [context, caseStatus, ...(await controls.all()), ...(await links.all())]) {
          const bounds = await measure(element);
          expect(bounds.x).toBeGreaterThanOrEqual(headerBounds.x);
          expect(bounds.right).toBeLessThanOrEqual(headerBounds.right);
          expect(bounds.y).toBeGreaterThanOrEqual(headerBounds.y);
          expect(bounds.bottom).toBeLessThanOrEqual(headerBounds.bottom);
          expect(bounds.right).toBeLessThanOrEqual(width);
          await expect.poll(() => isUnobscured(element)).toBe(true);
        }
        if (width === 1536) {
          const report = header.getByTestId('register-new-errand-button');
          await expect(report).toBeVisible();
          const reportBounds = await measure(report);
          const contextBounds = await measure(context);
          expect(reportBounds.y).toBeLessThan(contextBounds.bottom);
          expect(reportBounds.bottom).toBeGreaterThan(contextBounds.y);
        }

        // Registration uses the same header with its longer subtitle and without a case menu.
        await page.goto(appUrl(`${prefix}/arende/registrera`));
        await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const subtitle = header.getByText(locale === 'sv' ? 'Avvikelserapportering' : 'Incident reporting', {
          exact: true,
        });
        const bounds = await measure(subtitle);
        const registrationHeaderBounds = await measure(header);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width);
        expect(bounds.bottom).toBeLessThanOrEqual(registrationHeaderBounds.bottom);
        const languageButton = header.getByTestId('language-switch-button').filter({ visible: true });
        await expect.poll(() => isUnobscured(languageButton)).toBe(true);
      });
    }
  }

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Keeps the Report link contrast above AA in ${colorScheme} mode`, async ({ appUrl, page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
      await expect(page.getByTestId('message-composer')).toBeVisible();
      const link = page.getByTestId('register-new-errand-button');
      await expect(link).toBeEnabled();
      await page.mouse.move(0, 900);
      await expect.poll(() => textContrast(link)).toBeGreaterThanOrEqual(4.5);
      await link.hover();
      await expect.poll(() => textContrast(link)).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0, 900);
      await link.focus();
      await expect(link).toBeFocused();
      await expect.poll(() => textContrast(link)).toBeGreaterThanOrEqual(4.5);
    });

    test(`Shows the focused skip link above the header and reaches main in ${colorScheme} mode`, async ({
      appUrl,
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      for (const width of [320, 1536]) {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
        await expect(page.getByRole('textbox', { name: /Skriv ett meddelande/ })).toBeEditable();
        await page.evaluate(() => document.fonts.ready);
        const skipLink = page.getByRole('link', { name: 'Hoppa till innehåll' });
        // Start from the first header link, independently of navigation's initial focus.
        await page.locator('.sk-header').filter({ visible: true }).getByRole('link').first().focus();
        await page.keyboard.press('Shift+Tab');
        await expect(skipLink).toBeFocused();
        await expect.poll(() => isUnobscured(skipLink)).toBe(true);
        await expect.poll(() => textContrast(skipLink)).toBeGreaterThanOrEqual(4.5);
        const bounds = await measure(skipLink);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width);
        await skipLink.press('Enter');
        await expect(page.locator('main#content')).toBeFocused();
      }
    });
  }
});
