import { writeFile } from 'node:fs/promises';

import type { Locator } from '@playwright/test';

import { getMe } from '../fixtures/getMe';
import { mockErrand } from '../fixtures/mockErrand';
import { mockErrands } from '../fixtures/mockErrands';
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
    // Responsive hydration can replace the element during the animation frame.
    // Return a failing sample so expect.poll resolves the current locator again.
    if (!element.isConnected) return 0;
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
      const surface = parseColor(style.backgroundColor);
      // Astryx interaction surfaces use a uniform linear gradient as a tint layer.
      // Composite every such layer; a varying gradient still needs visual review.
      const images = style.backgroundImage;
      const uniformLayers = [...images.matchAll(/linear-gradient\((rgba?\([^)]+\)), \1\)/g)];
      if (images !== 'none' && uniformLayers.map(([image]) => image).join(', ') !== images) {
        throw new Error(`A nonuniform image background requires visual contrast review: ${images}`);
      }
      backgrounds.unshift(surface, ...uniformLayers.map(([, color]) => parseColor(color)).reverse());
      if (surface[3] === 1) break;
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
      }, testInfo) => {
        await page.setViewportSize({ width, height: 960 });
        const prefix = locale === 'en' ? '/en' : '';
        await page.goto(appUrl(`${prefix}/arende/${mockErrand.errandNumber}/meddelanden`));
        await expect(page.getByTestId('message-composer')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const header = page.getByRole('banner');
        const headerBounds = await measure(header);
        expect(headerBounds.height).toBeLessThanOrEqual(72);
        await header.screenshot({ path: testInfo.outputPath(`header-${locale}-${width}.png`) });
        await writeFile(
          testInfo.outputPath('header-dimensions.json'),
          JSON.stringify({ locale, width, height: headerBounds.height })
        );
        const controls = header.getByRole('button').filter({ visible: true });
        expect(await controls.count()).toBeGreaterThanOrEqual(3);
        for (const element of [...(await controls.all()), ...(await header.getByRole('link').all())]) {
          const bounds = await measure(element);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.right).toBeLessThanOrEqual(width);
          expect(bounds.y).toBeGreaterThanOrEqual(headerBounds.y);
          expect(bounds.bottom).toBeLessThanOrEqual(headerBounds.bottom);
          await expect.poll(() => isUnobscured(element)).toBe(true);
        }
        await expect(page.getByRole('heading', { level: 1 })).toContainText(mockErrand.errandNumber ?? '');
        await expect(page.getByRole('main').getByTestId('errand-status')).toBeVisible();
        const identity = page.getByTestId('errand-identity');
        if (width === 320) {
          const titleBounds = await measure(identity.getByRole('heading', { level: 1 }));
          const statusBounds = await measure(identity.getByTestId('errand-status'));
          expect(statusBounds.x).toBeGreaterThanOrEqual(titleBounds.right);
          expect(
            Math.abs(titleBounds.y + titleBounds.height / 2 - statusBounds.y - statusBounds.height / 2)
          ).toBeLessThan(2);
          expect((await measure(identity)).height).toBeLessThanOrEqual(32);
        }
        await identity.screenshot({ path: testInfo.outputPath(`case-identity-${locale}-${width}.png`) });
        await page.goto(appUrl(`${prefix}/arende/registrera`));
        await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
        expect((await measure(header)).height).toBeLessThanOrEqual(72);
        const languageButton = header.getByTestId('language-switch-button').filter({ visible: true });
        await expect.poll(() => isUnobscured(languageButton)).toBe(true);
      });
    }
  }

  test('Keeps the mobile Report menu entry as a keyboard-operable native link', async ({ appUrl, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
    await expect(page.getByTestId('message-composer')).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Öppna användarmeny', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const report = page.getByRole('menuitem', { name: 'Rapportera', exact: true });
    await expect(report).toHaveAttribute('href', /\/arende\/registrera$/);
    await expect(report).toBeFocused();
    await report.press('Enter');
    await expect(page).toHaveURL(/\/arende\/registrera$/);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Keeps the app identity readable in both headers in ${colorScheme} mode`, async ({ appUrl, page }) => {
      await page.emulateMedia({ colorScheme });
      await page.route('**/supportmanagement/errands?*', jsonRoute(mockErrands));
      await page.route('**/supportmanagement/count?*', jsonRoute({ count: mockErrands.totalElements }));
      for (const width of [390, 1536]) {
        await page.setViewportSize({ width, height: 960 });
        for (const path of ['/oversikt', `/arende/${mockErrand.errandNumber}/meddelanden`]) {
          await page.goto(appUrl(path));
          const identity = page.getByRole('banner').getByText(process.env.NEXT_PUBLIC_APP_NAME ?? '', { exact: true });
          await expect(identity).toBeVisible();
          await expect.poll(() => textContrast(identity)).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    test(`Keeps the Report link contrast above AA in ${colorScheme} mode`, async ({ appUrl, page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
      await expect(page.getByTestId('message-composer')).toBeVisible();
      await page.getByRole('button', { name: 'Öppna användarmeny', exact: true }).click();
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
        await page.getByRole('banner').getByRole('link').first().focus();
        await page.keyboard.press('Shift+Tab');
        await expect(skipLink).toBeFocused();
        await expect.poll(() => isUnobscured(skipLink)).toBe(true);
        await expect.poll(() => textContrast(skipLink)).toBeGreaterThanOrEqual(4.5);
        const bounds = await measure(skipLink);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width);
        await skipLink.press('Enter');
        await expect(page.getByRole('main')).toBeFocused();
      }
    });
  }
});

test('keeps long user names and all header controls reachable at a narrow desktop width', async ({ page, appUrl }) => {
  await page.route(
    '**/api/me',
    jsonRoute({
      ...getMe,
      name: 'Alexandra Margareta Andersson Lindström',
      username: 'alexandra.margareta.andersson.lindstrom',
    })
  );
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto(appUrl('/arende/registrera'));
  await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
  const header = page.getByRole('banner');
  for (const button of await header.getByRole('button').filter({ visible: true }).all()) {
    await expect.poll(() => isUnobscured(button)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(800);
});
