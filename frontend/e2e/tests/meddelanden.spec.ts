import { ConversationMessageDTO } from '@data-contracts/backend/data-contracts';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { emptyRoute, jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const conversationPath = `**/supportmanagement/errand/${mockErrand.id}/conversations`;
const messagePath = `${conversationPath}/conv-1/messages`;
const message = (id: string, text: string): ConversationMessageDTO => ({
  conversationId: 'conv-1',
  messageId: id,
  message: `<p>${text}</p>`,
  viewed: true,
  attachments: [],
  direction: 'INBOUND',
});

test.beforeEach(async ({ page }) => {
  await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, jsonRoute(mockErrand));
  await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  await page.route('**/supportmanagement/notifications', jsonRoute([]));
  await page.route(conversationPath, async (route) => {
    await jsonRoute(route.request().method() === 'POST' ? { id: 'conv-1' } : [{ id: 'conv-1' }])(route);
  });
  await page.route(`${messagePath}/mark-as-read`, emptyRoute());
});

test('older messages remain reachable after a system-only page, and returning to the page shows a new reply', async ({
  page,
  appUrl,
}) => {
  let replyArrived = false;
  await page.route(`${messagePath}?*`, async (route) => {
    const requested = Number(new URL(route.request().url()).searchParams.get('page'));
    await jsonRoute({
      page: requested,
      hasMore: requested === 0,
      messages:
        requested === 0 ?
          replyArrived ? [message('new', 'Nytt svar från handläggaren')]
          : []
        : [message('old', 'Tidigare meddelande')],
    })(route);
  });
  await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
  await page.getByRole('button', { name: 'Visa äldre meddelanden' }).click();
  await expect(page.getByTestId('message-body')).toContainText('Tidigare meddelande');
  replyArrived = true;
  // Meddelandena hämtas när sidan laddas, så ett flikbyte fram och tillbaka visar det nya svaret.
  // Fliken döljer panelen direkt vid klick, så vänta på adressen. Dev-servern kompilerar
  // Grundinformation vid första besöket, och det tar längre tid än standardväntan.
  await page.getByRole('tab', { name: 'Grundinformation' }).click();
  await expect(page).toHaveURL(/\/grundinformation$/, { timeout: 20_000 });
  await page.getByRole('tab', { name: 'Meddelanden' }).click();
  await expect(page).toHaveURL(/\/meddelanden$/);
  await expect(page.getByText('Nytt svar från handläggaren', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Visa äldre meddelanden' }).click();
  await expect(page.getByTestId('message-body')).toHaveCount(2);
  await expect(page.getByText('Nytt svar från handläggaren', { exact: true })).toBeVisible();
  await expect(page.getByText('Tidigare meddelande', { exact: true })).toBeVisible();
});

test('the real editor and attachments are locked while a message is being sent', async ({ page, appUrl }) => {
  const pending = Promise.withResolvers<undefined>();
  await page.route(`${messagePath}?*`, jsonRoute({ page: 0, hasMore: false, messages: [] }));
  await page.route(messagePath, async (route) => {
    if (route.request().method() === 'POST') await pending.promise;
    await emptyRoute()(route);
  });
  await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
  const editor = page.locator('.ql-editor');
  await editor.fill('Meddelandet som ska skickas');
  await page.getByRole('button', { name: 'Skicka', exact: true }).click();
  try {
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    await expect(page.locator('input[type="file"]')).toBeDisabled();
    await expect(page.getByTestId('send-message-button')).toBeDisabled();
    await expect(editor).toHaveText('Meddelandet som ska skickas');
  } finally {
    pending.resolve(undefined);
  }
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await expect(editor).toHaveText('');
  await expect(page.locator('.sk-snackbar-text', { hasText: 'Meddelandet skickades' })).toBeVisible();
  await editor.fill('Ett till meddelande');
  await expect(page.getByTestId('send-message-button')).toBeEnabled();
});
