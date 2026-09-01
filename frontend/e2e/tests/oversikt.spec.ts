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
  test('Lists the report views in the sidebar and names the selected one above the table', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    const submittedButton = page.locator('[aria-label="status-button-Inskickade"]');
    await expect(submittedButton).toBeEnabled();
    await expect(submittedButton).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[aria-label="status-button-Avslutade"]')).toBeEnabled();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inskickade');
    await expect(page.getByTestId('errand-count')).toHaveText(`Visar ${mockErrands.totalElements ?? 0} ärenden`);
  });

  test('Show correct errand table header and correct ammount of errands', async ({ page }) => {
    const table = page.getByTestId('errand-table');
    await expect(table).toBeVisible();

    const headerCells = table.locator('.sk-table-thead-tr').first().locator('th');
    await expect(headerCells.nth(0).locator('span').first()).toHaveText('Typ av rapport');
    await expect(headerCells.nth(1).locator('span').first()).toHaveText('Status');
    await expect(headerCells.nth(2).locator('span').first()).toHaveText('Ärendenummer');
    await expect(headerCells.nth(3).locator('span').first()).toHaveText('Registrerat');

    await expect(table.locator('.sk-table-tbody-tr')).toHaveCount(mockErrands?.content?.length ?? 0);
  });

  test('Links to registration exactly once below the configured base path', async ({ baseURL, page }) => {
    const appBaseUrl = new URL(baseURL ?? 'http://localhost:3000');
    const basePath = appBaseUrl.pathname.replace(/\/$/, '');

    await expect(page.getByTestId('register-new-errand-button')).toHaveAttribute(
      'href',
      `${basePath}/arende/registrera`
    );
  });

  test('Opens the errand from anywhere on the row', async ({ page }) => {
    const firstRow = page.getByTestId('errand-table').locator('.sk-table-tbody-tr').first();
    await expect(firstRow).toBeVisible();

    // Klicket läggs på ärendenumret, alltså utanför pilknappen, för att visa att hela raden bär det.
    await firstRow.getByText('AIA-25120019').click();

    await expect(page).toHaveURL(/\/arende\/AIA-25120019\/grundinformation$/);
  });

  // TODO: Add test for search field when frontend functionality is ready
  // TODO: Add test for all filters
  // TODO: Add test for notification bell when frontend functionality is ready
});
