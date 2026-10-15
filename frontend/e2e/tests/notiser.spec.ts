import type { SupportNotificationDTO } from '@data-contracts/backend/data-contracts';
import type { Request } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockErrands } from '../fixtures/mockErrands';
import { mockMetadata } from '../fixtures/mockMetadata';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const messages: SupportNotificationDTO = {
  id: '6b1d3c1e-2f4a-4b5c-9d6e-7f8091a2b3c4',
  created: '2026-10-01T08:00:00Z',
  acknowledged: false,
  errandId: mockErrand.id ?? '',
  errandNumber: mockErrand.errandNumber ?? '',
  events: [
    { created: '2026-10-01T09:00:00Z', eventType: 'CREATE', subType: 'MESSAGE', description: 'Meddelande mottaget' },
    { created: '2026-10-01T08:00:00Z', eventType: 'CREATE', subType: 'MESSAGE', description: 'Meddelande mottaget' },
  ],
};

const statusChange: SupportNotificationDTO = {
  id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  created: '2026-09-30T08:00:00Z',
  acknowledged: false,
  errandId: 'e2e-other-errand',
  errandNumber: 'AIA-25120020',
  events: [
    { created: '2026-09-30T08:00:00Z', eventType: 'UPDATE', subType: 'ERRAND', description: 'Ärende uppdaterat' },
  ],
};

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/supportmanagement/errands?*', jsonRoute(mockErrands));
    await page.route('**/supportmanagement/count?*', jsonRoute({ count: mockErrands.totalElements }));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
  });

  test('Shows several events on one report as one notification that can be expanded', async ({ appUrl, page }) => {
    await page.route('**/supportmanagement/notifications', jsonRoute([messages]));
    await page.goto(appUrl('/oversikt'));

    await page.getByRole('button', { name: 'Öppna notifieringar (1 oläst)' }).click();
    const panel = page.getByRole('dialog', { name: 'Notifieringar' });

    const notification = panel.getByTestId('notification-item');
    await expect(notification).toHaveCount(1);
    await expect(notification).toContainText('2 nya meddelanden');
    await expect(panel.getByTestId('notification-event')).toHaveCount(0);

    await panel.getByRole('button', { name: 'Visa 2 händelser' }).click();
    await expect(panel.getByTestId('notification-event')).toHaveCount(2);
    await expect(panel.getByRole('button', { name: 'Dölj händelser' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('Marks the selected notifications as read', async ({ appUrl, page }) => {
    let notifications = [messages, statusChange];
    await page.route('**/supportmanagement/notifications', async (route) => {
      await jsonRoute(notifications)(route);
    });
    const acknowledgements: unknown[] = [];
    await page.route('**/supportmanagement/notifications/acknowledge', async (route) => {
      if (route.request().method() === 'PATCH') {
        acknowledgements.push(route.request().postDataJSON());
        notifications = notifications.map((notification) =>
          notification.id === statusChange.id ? { ...notification, acknowledged: true } : notification
        );
      }
      await jsonRoute({ acknowledged: [statusChange.id], failed: [] })(route);
    });
    await page.goto(appUrl('/oversikt'));

    await page.getByRole('button', { name: 'Öppna notifieringar (2 olästa)' }).click();
    const panel = page.getByRole('dialog', { name: 'Notifieringar' });
    const selectStatusChange = panel.getByRole('checkbox', {
      name: `Välj notisen för ärende ${statusChange.errandNumber}`,
    });
    // Designsystemets bock ligger ovanpå själva rutan; användaren klickar på den, inom rutans label.
    await selectStatusChange.locator('xpath=ancestor::label[1]').click();
    await expect(selectStatusChange).toBeChecked();
    await panel.getByRole('button', { name: 'Markera som läst (1)' }).click();

    await expect(page.getByText('Notisen är markerad som läst.')).toBeVisible();
    expect(acknowledgements).toEqual([{ ids: [statusChange.id] }]);
    await expect(panel.getByRole('button', { name: /Markera som läst/ })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Stäng notifieringar' }).click();
    await expect(page.getByRole('button', { name: 'Öppna notifieringar (1 oläst)' })).toBeVisible();
  });

  test('Marks the notifications of a report as read when the report is opened', async ({ appUrl, page }) => {
    await page.route('**/supportmanagement/notifications', jsonRoute([messages]));
    await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber ?? ''}`, jsonRoute(mockErrand));
    const acknowledged = page.waitForRequest(
      (request: Request) =>
        request.method() === 'PUT' &&
        request.url().endsWith(`/supportmanagement/errand/${mockErrand.id ?? ''}/notifications/acknowledge`)
    );
    await page.route(`**/supportmanagement/errand/${mockErrand.id ?? ''}/notifications/acknowledge`, async (route) => {
      await jsonRoute({ acknowledged: [messages.id], failed: [] })(route);
    });

    await page.goto(appUrl(`/arende/${mockErrand.errandNumber ?? ''}/grundinformation`));

    await acknowledged;
  });
});
