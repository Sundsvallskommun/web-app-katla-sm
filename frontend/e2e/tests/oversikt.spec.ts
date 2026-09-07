import { mockCountDraftErrands, mockCountNewErrands, mockCountSolvedErrands } from '../fixtures/mockCount';
import { mockErrands } from '../fixtures/mockErrands';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockNotifications } from '../fixtures/mockNotifications';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

test.describe('Overview page', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route(
      (url) => url.pathname.endsWith('/supportmanagement/errands') && url.searchParams.get('page') === '0',
      jsonRoute(mockErrands)
    );
    await page.route(
      (url) => url.pathname.endsWith('/supportmanagement/count') && url.searchParams.get('status') === 'NEW',
      jsonRoute(mockCountNewErrands)
    );
    await page.route(
      (url) => url.pathname.endsWith('/supportmanagement/count') && url.searchParams.get('status') === 'DRAFT',
      jsonRoute(mockCountDraftErrands)
    );
    await page.route(
      (url) => url.pathname.endsWith('/supportmanagement/count') && url.searchParams.get('status') === 'SOLVED',
      jsonRoute(mockCountSolvedErrands)
    );
    await page.route('**/supportmanagement/notifications', jsonRoute(mockNotifications));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.goto(appUrl('/oversikt'));
  });

  // Antalen står inte längre bredvid listorna i sidopanelen utan i rubriken över tabellen,
  // där de gäller den lista man faktiskt tittar på.
  test('Shows status filters directly and names the selected collection', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();

    const submittedButton = page.getByTestId('errand-status-filter').getByRole('radio', { name: 'Inskickade' });
    await expect(submittedButton).toBeEnabled();
    await expect(submittedButton).toBeChecked();
    await expect(page.getByTestId('errand-status-filter').getByRole('radio', { name: 'Avslutade' })).toBeEnabled();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mina rapporter');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Inskickade');
    await expect(page.getByTestId('errand-count')).toHaveText(
      `Visar ${mockErrands.content?.length ?? 0} av ${mockErrands.totalElements ?? 0}`
    );
  });

  test('Show correct errand table header and correct ammount of errands', async ({ page }) => {
    const table = page.getByTestId('errand-table');
    await expect(table).toBeVisible();

    const headerCells = table.getByRole('columnheader');
    await expect(headerCells.nth(0).getByRole('button')).toHaveText('Typ av rapport');
    await expect(headerCells.nth(1).getByRole('button')).toHaveText('Status');
    await expect(headerCells.nth(2).getByRole('button')).toHaveText('Ärendenummer');
    await expect(headerCells.nth(3).getByRole('button')).toHaveText('Registrerat');

    await expect(table.locator('tbody').getByRole('row')).toHaveCount(mockErrands?.content?.length ?? 0);
  });

  test('Links to registration exactly once below the configured base path', async ({ baseURL, page }) => {
    const appBaseUrl = new URL(baseURL ?? 'http://localhost:3000');
    const basePath = appBaseUrl.pathname.replace(/\/$/, '');

    await expect(page.getByTestId('register-new-errand-button')).toHaveAttribute(
      'href',
      `${basePath}/arende/registrera`
    );
  });

  test('Keeps navigation and the table reachable just above the mobile breakpoint', async ({ page }) => {
    for (const width of [800, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('errand-status-filter')).toBeVisible();
      const table = page.getByTestId('errand-table');
      await expect(table).toBeVisible();
      const openLink = table.getByTestId('open-errand-button').first();
      await openLink.focus();
      await expect(openLink).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test('Opens the errand from anywhere on the row', async ({ page }) => {
    const firstRow = page.getByTestId('errand-table').locator('tbody').getByRole('row').first();
    await expect(firstRow).toBeVisible();

    // The type cell delegates to the number link without reloading the document.
    await page.evaluate(() => {
      document.documentElement.dataset.navigationProbe = 'retained';
    });
    await firstRow.getByRole('cell').first().click();

    await expect(page).toHaveURL(/\/arende\/AIA-25120019\/grundinformation$/);
    await expect(page.locator('html')).toHaveAttribute('data-navigation-probe', 'retained');
  });

  test('keeps text selection on report rows from opening the report', async ({ page }) => {
    const row = page.getByTestId('errand-table').locator('tbody').getByRole('row').first();
    const typeCell = row.getByRole('cell').first();
    await typeCell.evaluate((element) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await typeCell.dispatchEvent('click');
    await expect(page).toHaveURL(/\/oversikt$/);
    await expect(row.getByRole('link')).toHaveCount(1);
  });

  test('uses the shared Next link for registration without reloading the document', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dataset.navigationProbe = 'retained';
    });
    await page.getByTestId('register-new-errand-button').click();
    await expect(page).toHaveURL(/\/arende\/registrera$/);
    await expect(page.locator('html')).toHaveAttribute('data-navigation-probe', 'retained');
  });

  test('Keeps the notification dialog inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Öppna notifieringar' }).click();

    const panel = page.getByRole('dialog', { name: 'Notifieringar' });
    await expect(panel).toBeVisible();
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const geometry = await panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        position: window.getComputedStyle(element).position,
        right: bounds.right,
        left: bounds.left,
        top: bounds.top,
        bottom: bounds.bottom,
        viewportBottom: window.innerHeight,
        viewportRight: window.innerWidth,
      };
    });

    expect(geometry.position).toBe('fixed');
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportRight);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportBottom);
  });

  // TODO: Add test for search field when frontend functionality is ready
  // TODO: Add test for all filters
});
