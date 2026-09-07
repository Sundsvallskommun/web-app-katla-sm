import type { ConversationMessageDTO } from '@data-contracts/backend/data-contracts';

import { mockErrand } from '../fixtures/mockErrand';
import { mockErrands } from '../fixtures/mockErrands';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { emptyRoute, jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const report = mockErrands.content?.[0];
if (!report) throw new Error('The mobile overview requires a report fixture.');
const reports = Array.from({ length: 3 }, (_, index) => ({ ...report, errandNumber: `AIA-2512002${index}` }));

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route('**/supportmanagement/count?*', jsonRoute(3));
  await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
});

for (const locale of ['sv', 'en']) {
  test(`mobile overview ${locale}: skeleton, visible filters and native report links at 320px`, async ({
    page,
    appUrl,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const pending = Promise.withResolvers<undefined>();
    await page.route('**/supportmanagement/errands?*', async (route) => {
      await pending.promise;
      await jsonRoute({ ...mockErrands, content: reports, totalElements: 3, totalPages: 1 })(route);
    });
    await page.goto(appUrl(`${locale === 'en' ? '/en' : ''}/oversikt`));
    try {
      await expect(page.getByTestId('errand-list-skeleton')).toBeVisible();
      await expect(page.getByTestId('errand-list-item')).toHaveCount(0);
      await expect(page.getByTestId('errand-status-filter')).toBeVisible();
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await page.screenshot({ path: testInfo.outputPath(`overview-loading-${locale}-320.png`) });
    } finally {
      pending.resolve(undefined);
    }
    await expect(page.getByTestId('errand-list-item')).toHaveCount(3);
    await expect(page.getByTestId('errand-list-skeleton')).toHaveCount(0);
    const items = page.getByTestId('errand-list-item');
    for (const item of await items.all()) {
      await expect(item.getByRole('link')).toHaveCount(1);
      await expect(item.getByRole('link')).toHaveAttribute('href', /\/arende\/AIA-2512002\d\/grundinformation$/);
    }
    const closed = page
      .getByTestId('errand-status-filter')
      .getByRole('radio', { name: locale === 'en' ? 'Closed' : 'Avslutade' });
    await closed.focus();
    await closed.press('Space');
    await expect(closed).toBeChecked();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(locale === 'en' ? 'Closed' : 'Avslutade');
    await expect(items).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.screenshot({ path: testInfo.outputPath(`overview-${locale}-320.png`) });
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(page.getByTestId('errand-table').getByRole('link')).toHaveCount(3);
    await expect(page.getByTestId('errand-list-item')).toHaveCount(0);
    await expect(closed).toBeChecked();
    await expect(page.getByRole('banner')).toHaveCount(1);
  });
}

test('keeps the app header usable while an errand loads', async ({ page, appUrl }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pending = Promise.withResolvers<undefined>();
  await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, async (route) => {
    await pending.promise;
    await jsonRoute(mockErrand)(route);
  });
  await page.route('**/conversations*', jsonRoute([]));
  await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
  try {
    await expect(page.getByTestId('errand-content-skeleton')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Öppna användarmeny' })).toBeEnabled();
    await expect(page.getByTestId('errand-status')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('errand-loading-390.png') });
    await page.getByRole('button', { name: 'Öppna användarmeny' }).click();
    await expect(page.getByRole('menuitem', { name: 'Logga ut' })).toBeVisible();
  } finally {
    pending.resolve(undefined);
  }
  await expect(page.getByTestId('errand-content-skeleton')).toHaveCount(0);
  await expect(page.getByTestId('errand-status')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Logga ut' })).toBeVisible();
});

test('shows the conversation before the composer and keeps unsent text through refresh and formatting disclosure', async ({
  page,
  appUrl,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, jsonRoute(mockErrand));
  const conversationPath = `**/supportmanagement/errand/${mockErrand.id}/conversations`;
  const messagePath = `${conversationPath}/conv-1/messages`;
  await page.route(conversationPath, jsonRoute([{ id: 'conv-1' }]));
  await page.route(`${messagePath}/mark-as-read`, emptyRoute());
  const initial = Promise.withResolvers<undefined>();
  const refresh = Promise.withResolvers<undefined>();
  let refreshing = false;
  const message: ConversationMessageDTO = {
    conversationId: 'conv-1',
    messageId: 'reply-1',
    direction: 'INBOUND',
    message: '<p>Tack för din rapport. Vi återkommer när den är behandlad.</p>',
    firstName: 'Anna',
    lastName: 'Andersson',
    sent: '2026-09-07T09:00:00+02:00',
    viewed: true,
    attachments: [],
  };
  await page.route(`${messagePath}?*`, async (route) => {
    await (refreshing ? refresh.promise : initial.promise);
    await jsonRoute({ page: 0, hasMore: false, messages: [message] })(route);
  });
  await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
  try {
    await expect(page.getByTestId('message-list-skeleton')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('messages-loading-390.png') });
  } finally {
    initial.resolve(undefined);
  }
  const reply = page.getByTestId('message');
  await expect(reply).toBeVisible();
  const composer = page.getByTestId('message-composer');
  expect(
    await reply.evaluate((element) => {
      const form = document.querySelector('[data-cy="message-composer"]');
      return !!form && !!(element.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
    })
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('messages-conversation-390.png') });
  await page.getByRole('link', { name: 'Skriv ett meddelande', exact: true }).click();
  const editor = composer.getByRole('textbox');
  await expect(editor).toBeFocused();
  await editor.fill('Mitt oskickade svar');
  const formatting = composer.getByRole('button', { name: 'Textformatering', exact: true });
  await formatting.click();
  await expect(composer.getByRole('button', { name: 'Fet', exact: true })).toBeVisible();
  await formatting.click();
  await expect(editor).toHaveText('Mitt oskickade svar');
  refreshing = true;
  await page.getByRole('button', { name: 'Uppdatera meddelanden' }).click();
  try {
    await expect(reply).toBeVisible();
    await expect(editor).toHaveText('Mitt oskickade svar');
    await expect(page.getByTestId('message-list-skeleton')).toHaveCount(0);
  } finally {
    refresh.resolve(undefined);
  }
  await expect(page.getByRole('button', { name: 'Uppdatera meddelanden' })).toBeEnabled();
  await expect(editor).toHaveText('Mitt oskickade svar');
});

test('keeps wizard actions reachable at a constrained phone height and focuses the next step', async ({
  page,
  appUrl,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto(appUrl('/arende/registrera'));
  await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
  const next = page.getByRole('button', { name: 'Nästa', exact: true });
  await expect(next).toBeInViewport();
  await next.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByTestId('event-type-deviation')).toBeVisible();
  await expect(next).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('wizard-390-568.png') });
});
