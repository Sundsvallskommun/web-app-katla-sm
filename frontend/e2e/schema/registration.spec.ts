import type { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { expect, test } from '@playwright/test';

import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';

const name = 'schema-test-arendeuppgifter';
const schemaId = 'schema-test-v1';
const schema = {
  schemaId,
  schema: {
    type: 'object',
    properties: { description: { type: 'string', title: 'Beskriv beställningen', minLength: 1 } },
    required: ['description'],
  },
  uiSchema: {},
};

test.beforeEach(async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: 'katla.schema-test.sid', value: 'fixture-one', url: baseURL ?? 'http://localhost:3200' },
    { name: 'SKCookieConsent', value: 'necessary%2Cstats', url: baseURL ?? 'http://localhost:3200' },
  ]);
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
  await page.route(`**/schemas/latest/${name}`, jsonRoute(schema));
  await page.route(`**/schemas/${schemaId}`, jsonRoute(schema));
});

test('registers schema data on desktop and mobile without Avvikelse fields', async ({ page, isMobile }) => {
  let submitted: ErrandDTO | undefined;
  await page.route('**/supportmanagement/errand/create', async (route) => {
    submitted = route.request().postDataJSON() as ErrandDTO;
    await jsonRoute({ ...submitted, id: 'schema-created', errandNumber: 'SCH-1' })(route);
  });
  await page.goto('/arende/registrera');
  if (isMobile) await page.getByRole('button', { name: 'Nästa', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /Beskriv beställningen/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Avvikelse|Missförhållande|Enskild brukare/ })).toHaveCount(0);
  await expect(page.locator('[data-cy="facility-search"]')).toHaveCount(0);
  await page.getByRole('textbox', { name: /Beskriv beställningen/ }).fill('Två nya skärmar');
  if (isMobile) {
    await page.getByRole('button', { name: 'Nästa', exact: true }).click();
    await page.getByRole('button', { name: 'Skicka', exact: true }).click();
  } else await page.getByTestId('register-errand').click();
  await page.getByTestId('submit-button').click();
  await expect(page).toHaveURL(/\/arende\/inskickad$/);
  expect(submitted?.status).toBe('NEW');
  expect(submitted?.parameters ?? []).toEqual([]);
  expect(submitted?.labels ?? []).toEqual([]);
  expect(submitted?.jsonParameters).toEqual([{ key: name, schemaId, value: { description: 'Två nya skärmar' } }]);
});

test('blocks registration until the active schema is complete', async ({ page, isMobile }) => {
  let writes = 0;
  await page.route('**/supportmanagement/errand/create', (route) => {
    writes += 1;
    return route.abort();
  });
  await page.goto('/arende/registrera');
  if (isMobile) {
    await page.getByRole('button', { name: 'Nästa', exact: true }).click();
    await expect(page.getByRole('textbox', { name: /Beskriv beställningen/ })).toBeVisible();
    await page.getByRole('button', { name: 'Nästa', exact: true }).click();
    await expect(page.getByRole('textbox', { name: /Beskriv beställningen/ })).toHaveAttribute('aria-invalid', 'true');
  } else {
    await expect(page.getByRole('textbox', { name: /Beskriv beställningen/ })).toBeVisible();
    await page.getByTestId('register-errand').click();
    await expect(page.getByTestId('errand-error-summary')).toBeVisible();
  }
  await expect(page.getByTestId('submit-button')).not.toBeVisible();
  expect(writes).toBe(0);
});

test('saves an untouched draft, reopens its form and submits the original schema version', async ({
  page,
  isMobile,
}) => {
  let stored: ErrandDTO | undefined;
  let latestVersion = schemaId;
  let latestReads = 0;
  const writes: ErrandDTO[] = [];
  await page.route(`**/schemas/latest/${name}`, (route) => {
    latestReads += 1;
    return jsonRoute({ ...schema, schemaId: latestVersion })(route);
  });
  await page.route('**/supportmanagement/errand/create', (route) => {
    if (route.request().method() === 'OPTIONS') return jsonRoute({})(route);
    const payload = route.request().postDataJSON() as ErrandDTO;
    writes.push(payload);
    stored = { ...payload, id: 'schema-early-draft', errandNumber: 'SCH-EARLY-1' };
    latestVersion = 'schema-test-v2';
    return jsonRoute(stored)(route);
  });
  await page.route('**/supportmanagement/errand/SCH-EARLY-1', (route) => jsonRoute(stored)(route));
  await page.route('**/supportmanagement/errand/schema-early-draft', (route) => {
    if (route.request().method() === 'OPTIONS') return jsonRoute({})(route);
    const payload = route.request().postDataJSON() as ErrandDTO;
    writes.push(payload);
    stored = { ...stored, ...payload };
    return jsonRoute(stored)(route);
  });

  await page.goto('/arende/registrera');
  await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
  if (isMobile) {
    // No schema component has mounted yet: saving must bind its reference independently of presentation.
    await expect(page.getByRole('textbox', { name: /Beskriv beställningen/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Spara', exact: true }).click();
  } else {
    await page.getByTestId('save-draft-errand').click();
  }
  await expect(page).toHaveURL(/\/arende\/SCH-EARLY-1\/grundinformation$/);
  expect(writes[0]?.status).toBe('DRAFT');
  expect(writes[0]?.jsonParameters).toEqual([{ key: name, schemaId, value: {} }]);
  const readsBeforeReopening = latestReads;

  // A full reload also removes the in-memory schema cache. The published latest version is now v2.
  await page.reload();
  if (isMobile) await page.getByRole('button', { name: 'Nästa', exact: true }).click();
  const description = page.getByRole('textbox', { name: /Beskriv beställningen/ });
  await expect(description).toBeVisible();
  await description.fill('Beställning från återöppnat utkast');
  if (isMobile) {
    await page.getByRole('button', { name: 'Nästa', exact: true }).click();
    await page.getByRole('button', { name: 'Skicka', exact: true }).click();
  } else {
    await page.getByTestId('register-errand').click();
  }
  await page.getByTestId('submit-button').click();
  await expect(page).toHaveURL(/\/arende\/inskickad$/);
  expect(writes).toHaveLength(2);
  expect(writes[1]?.status).toBe('NEW');
  expect(writes[1]?.jsonParameters).toEqual([
    { key: name, schemaId, value: { description: 'Beställning från återöppnat utkast' } },
  ]);
  expect(latestReads).toBe(readsBeforeReopening);
});
