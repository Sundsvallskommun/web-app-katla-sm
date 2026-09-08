import { writeFile } from 'node:fs/promises';

import axe from 'axe-core';

import { mockErrand } from '../fixtures/mockErrand';
import { mockErrands } from '../fixtures/mockErrands';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockNotifications } from '../fixtures/mockNotifications';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';
import { COOKIE_CONSENT_NAME, expect, test } from '../utils/test';

declare global {
  interface Window {
    axe: typeof axe;
  }
}

const schema = {
  schemaId: 'astryx-accessibility',
  schema: {
    type: 'object',
    properties: { incidentDescription: { type: 'string', title: 'Beskriv händelsen', minLength: 1 } },
    required: ['incidentDescription'],
  },
  uiSchema: { incidentDescription: { 'ui:widget': 'textarea' } },
};

const pages = [
  { name: 'login', path: '/login' },
  { name: 'overview', path: '/oversikt' },
  { name: 'register', path: '/arende/registrera' },
  { name: 'messages', path: `/arende/${mockErrand.errandNumber}/meddelanden` },
];

test.beforeEach(async ({ page }) => {
  await page.route((url) => url.pathname.endsWith('/errands'), jsonRoute(mockErrands));
  await page.route((url) => url.pathname.endsWith('/count'), jsonRoute(mockErrands.totalElements));
  await page.route('**/supportmanagement/notifications', jsonRoute(mockNotifications));
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
  await page.route('**/schemas/**', jsonRoute(schema));
  await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, jsonRoute(mockErrand));
  await page.route('**/conversations*', jsonRoute([]));
});

for (const mode of ['light', 'dark'] as const) {
  for (const width of [1536, 390]) {
    for (const scenario of pages) {
      test(`${scenario.name} ${mode} ${width}: accessibility and reflow`, async ({ page, appUrl }, testInfo) => {
        await page.setViewportSize({ width, height: 960 });
        await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' });
        const pageErrors: string[] = [];
        page.on('pageerror', (error) => {
          pageErrors.push(error.message);
        });
        await page.goto(appUrl(scenario.path));

        if (scenario.name === 'login') await expect(page.getByTestId('login-button')).toBeVisible();
        if (scenario.name === 'overview')
          await expect(page.getByTestId(width > 800 ? 'errand-table' : 'errand-list-item').first()).toBeVisible();
        if (scenario.name === 'register') {
          await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
          if (width > 800) {
            await page.getByTestId('event-type-deviation').getByRole('radio').check();
            await page.getByTestId('event-concerns-individual').getByRole('radio').check();
            await expect(page.getByRole('textbox', { name: /Beskriv händelsen/ })).toBeVisible();
          }
        }
        if (scenario.name === 'messages') await expect(page.getByTestId('message-composer')).toBeVisible();

        await page.addScriptTag({ content: axe.source });
        const result = await page.evaluate(async () => {
          const engine = window.axe;
          const audit = await engine.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
          });
          return { violations: audit.violations, incomplete: audit.incomplete };
        });
        // Incomplete rules are retained for manual review, never counted as passes.
        await writeFile(
          testInfo.outputPath('audit.json'),
          JSON.stringify({ name: scenario.name, mode, width, ...result, pageErrors }, null, 2)
        );
        await page.screenshot({ path: testInfo.outputPath(`${scenario.name}-${mode}-${width}.png`), fullPage: true });
        expect(pageErrors).toEqual([]);
        expect(result.violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      });
    }
  }
}

test('cookie choices remain reachable on a small screen and survive reload', async ({ page, context, appUrl }) => {
  await context.clearCookies({ name: COOKIE_CONSENT_NAME });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(appUrl('/oversikt'));
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toContainText('Katla');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Hantera kakor' }).click();
  await dialog.getByRole('checkbox').nth(1).check();
  const save = dialog.getByRole('button', { name: 'Spara mina val' });
  await save.scrollIntoViewIfNeeded();
  const bounds = await save.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(568);
  await save.click();
  await expect(dialog).not.toBeVisible();
  const consent = (await context.cookies()).find((cookie) => cookie.name === 'SKCookieConsent');
  expect(decodeURIComponent(consent?.value ?? '')).toBe('necessary,func');
  await page.reload();
  await expect(page.getByTestId('errand-list-item').first()).toBeVisible();
  await expect(dialog).not.toBeVisible();
});
