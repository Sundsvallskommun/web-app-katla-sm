import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) throw new Error('Catalogue Playwright baseURL is required.');
  await context.addCookies([
    { name: 'katla.catalogue.sid', value: 'fixture-many', url: baseURL },
    { name: 'SKCookieConsent', value: 'necessary%2Cstats', url: baseURL },
  ]);
});

test('shows zero, one and multiple allocations through the authenticated local API', async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Catalogue Playwright baseURL is required.');
  for (const { identity, count } of [
    { identity: 'fixture-none', count: 0 },
    { identity: 'fixture-one', count: 1 },
    { identity: 'fixture-many', count: 2 },
  ]) {
    await context.addCookies([{ name: 'katla.catalogue.sid', value: identity, url: baseURL }]);
    await page.goto(`${baseURL}/katlor`);
    await expect(page.getByRole('heading', { level: 1, name: 'Mina Katlor' })).toBeVisible();
    if (count === 0) {
      await expect(page.getByRole('heading', { name: 'Du har inga tillgängliga Katlor' })).toBeVisible();
    } else {
      await expect(page.getByRole('list', { name: 'Tillgängliga applikationer' }).getByRole('link')).toHaveCount(count);
      await expect(page.getByRole('link', { name: /AvvikelseRapportera|Avvikelse Rapportera/ })).toHaveAttribute(
        'href',
        'https://avvikelse.example.invalid'
      );
    }
    await expect(page.getByRole('button', { name: /notifieringar/ })).toHaveCount(0);
  }
});

test('offers retry after an API error without displaying an empty allocation', async ({ page, baseURL }) => {
  let unavailable = true;
  await page.route('**/api/applications', (route) =>
    unavailable ? route.fulfill({ status: 503, json: { message: 'unavailable' } }) : route.continue()
  );
  await page.goto(`${baseURL}/katlor`);
  await expect(page.getByRole('alert').filter({ hasText: 'kunde inte hämtas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Du har inga tillgängliga Katlor' })).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: 'Försök igen' }).click();
  await expect(page.getByRole('list', { name: 'Tillgängliga applikationer' }).getByRole('link')).toHaveCount(2);
});

test('blocks an incompatible deployment before application data loads', async ({ page, baseURL }) => {
  const businessRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/(me|applications|supportmanagement|schemas)/.test(new URL(request.url()).pathname))
      businessRequests.push(request.url());
  });
  await page.route('**/api/app-context', (route) =>
    route.fulfill({
      json: { data: { mode: 'katla', katlaId: 'avvikelse', definitionRevision: 'wrong' }, message: 'success' },
    })
  );
  await page.goto(`${baseURL}/katlor`);
  await expect(page.getByRole('alert').filter({ hasText: 'olika konfiguration' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mina Katlor' })).toHaveCount(0);
  expect(businessRequests).toEqual([]);
});

test('redirects anonymous direct links to login and preserves the catalogue destination', async ({
  page,
  context,
  baseURL,
}) => {
  await context.clearCookies();
  await page.goto(`${baseURL}/katlor`);
  await expect(page).toHaveURL(/\/portal\/login\?path=%2Fkatlor/);
  await expect(page.getByRole('button', { name: 'Logga in', exact: true })).toBeVisible();
});

test('keeps case routes inside catalogue mode without calling case APIs', async ({ page, baseURL }) => {
  const businessRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/(supportmanagement|schemas|employee|citizen)/.test(new URL(request.url()).pathname))
      businessRequests.push(request.url());
  });
  await page.goto(`${baseURL}/arende/registrera`);
  await expect(page).toHaveURL(/\/portal\/katlor$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mina Katlor' })).toBeVisible();
  expect(businessRequests).toEqual([]);
});

for (const width of [320, 1536]) {
  test(`supports keyboard navigation and wraps at ${width}px in both languages`, async ({
    page,
    baseURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    for (const locale of ['', '/en']) {
      await page.goto(`${baseURL}${locale}/katlor`);
      const list = page.getByRole('list', { name: locale ? 'Available applications' : 'Tillgängliga applikationer' });
      await expect(list.getByRole('link')).toHaveCount(2);
      const first = list.getByRole('link').first();
      await first.focus();
      await expect(first).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(list.getByRole('link').nth(1)).toBeFocused();
      await page.addScriptTag({ content: axe.source });
      const audit = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        });
        return { violations: result.violations, incomplete: result.incomplete };
      });
      await testInfo.attach(`accessibility-${locale ? 'en' : 'sv'}`, {
        body: JSON.stringify(audit),
        contentType: 'application/json',
      });
      expect(audit.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(
        1
      );
      await page.screenshot({ path: testInfo.outputPath(`catalogue-${width}-${locale ? 'en' : 'sv'}.png`) });
    }
  });
}
