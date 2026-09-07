import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_PERSON_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import { sectionByTitle } from '../utils/stakeholder';
import { expect, test } from '../utils/test';

const schema = {
  schemaId: 'form-presentation:1',
  schema: {
    type: 'object',
    properties: {
      date: { type: 'string', format: 'date', title: 'Händelsedatum' },
      time: { type: 'string', format: 'time', title: 'Klockslag' },
      location: { type: 'string', title: 'Plats', enum: ['Inomhus', 'Utomhus'] },
      description: { type: 'string', title: 'Beskriv händelsen' },
    },
  },
  uiSchema: { date: { 'ui:widget': 'date' }, time: { 'ui:widget': 'time' }, description: { 'ui:widget': 'textarea' } },
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route('**/schemas/**', jsonRoute(schema));
  await page.route('**/supportmanagement/errand/create', (route) => route.abort());
});

for (const width of [1536, 390]) {
  test(`stable person search and compact manual person at ${width}px`, async ({ page, appUrl }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(appUrl('/arende/registrera'));
    await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
    await page.getByRole('checkbox', { name: 'Jag rapporterar åt en kollega' }).check();
    const input = page.getByTestId('person-number-input').first();
    const before = await input.boundingBox();
    await input.fill('19900101');
    expect((await input.boundingBox())?.width).toBe(before?.width);
    await expect(page.getByRole('button', { name: 'Rensa sökning' })).toHaveCount(0);
    await expect(input).toBeFocused();
    // Composite fields paint focus on their rounded outer edge, never on the square inner input.
    await expect(input).toHaveCSS('outline-style', 'none');
    const wrapper = input.locator('xpath=ancestor::*[contains(@class,"astryx-text-input")][1]');
    await expect(wrapper).not.toHaveCSS('border-top-left-radius', '0px');
    await expect(wrapper).not.toHaveCSS('box-shadow', 'none');
    await page.screenshot({ path: testInfo.outputPath(`person-search-${width}.png`) });

    const add = page.getByTestId('add-manual-person-button').first();
    await expect(add).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await add.click();
    const dialog = page.getByRole('dialog', { name: 'Lägg till person manuellt', exact: true });
    await dialog.getByTestId('modal-firstName-input').fill('Alexandra');
    await dialog.getByTestId('modal-lastName-input').fill('Andersson');
    await dialog.getByTestId('modal-email-input').fill('alexandra.andersson@example.se');
    await dialog.getByTestId('modal-add-person-button').click();
    await expect(dialog).not.toBeVisible();
    const person = page.getByTestId('stakeholder-card').filter({ hasText: 'Alexandra Andersson' });
    const name = await person.getByTestId('stakeholder-name').boundingBox();
    const email = await person.getByTestId('stakeholder-email').boundingBox();
    expect(name).not.toBeNull();
    expect(email).not.toBeNull();
    expect(email?.x).toBe(name?.x);
    expect((email?.y ?? 0) - (name?.y ?? 0)).toBeLessThan(70);
    const remove = person.getByRole('button', { name: 'Ta bort' });
    await expect(remove).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await person.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`manual-person-${width}.png`) });
    await remove.click();
    await expect(person).toHaveCount(0);
    await expect(add).toBeVisible();
  });
}

test('native fields and report actions remain usable throughout a long form', async ({ page, appUrl }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 768 });
  await page.goto(appUrl('/arende/registrera'));
  await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
  await page.getByTestId('event-type-deviation').getByRole('radio').check();
  await page.getByTestId('event-concerns-individual').getByRole('radio').check();
  const individual = sectionByTitle(page, 'Enskild brukare');
  await page.route(`**/citizen/person/${MOCK_PERSON_NUMBER}`, jsonRoute(mockStakeholder));
  await individual.getByTestId('person-number-input').fill(MOCK_PERSON_NUMBER);
  await individual.getByRole('button', { name: 'Sök', exact: true }).click();
  await expect(individual.getByTestId('search-result')).toBeVisible();
  await individual.getByRole('button', { name: 'Rensa sökning' }).click();
  await expect(individual.getByTestId('search-result')).toHaveCount(0);
  await expect(individual.getByTestId('person-number-input')).toBeEditable();
  await expect(individual.getByTestId('person-number-input')).toHaveValue('');

  const actions = page.getByTestId('report-actions');
  const submit = actions.getByRole('button', { name: 'Skicka rapport' });
  const initial = await actions.boundingBox();
  await expect(submit).toBeInViewport();
  const date = page.getByLabel('Händelsedatum');
  const time = page.getByLabel('Klockslag');
  await date.fill('2026-09-04');
  await time.fill('15:30');
  await expect(date).toHaveValue('2026-09-04');
  await expect(time).toHaveValue('15:30');
  await date.focus();
  await expect(date).not.toHaveCSS('border-top-left-radius', '0px');
  await page.screenshot({ path: testInfo.outputPath('native-date-focus-1536.png') });
  const location = page.getByLabel('Plats', { exact: true });
  await location.selectOption('Inomhus');
  await location.focus();
  await page.screenshot({ path: testInfo.outputPath('native-select-focus-1536.png') });
  const lastInput = page.getByRole('textbox', { name: 'Beskriv händelsen' });
  await lastInput.fill('Sista fältet går att nå utan att täckas av åtgärdsraden.');
  await lastInput.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
  const scrolled = await actions.boundingBox();
  expect(scrolled?.y).toBe(initial?.y);
  const inputBounds = await lastInput.boundingBox();
  expect((inputBounds?.y ?? 0) + (inputBounds?.height ?? 0)).toBeLessThanOrEqual(scrolled?.y ?? 0);
  await page.screenshot({ path: testInfo.outputPath('report-actions-scrolled-1536.png') });
  await actions.getByRole('button', { name: 'Avbryt', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
