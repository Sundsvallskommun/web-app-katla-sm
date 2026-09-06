import type { Locator } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const measure = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('The message editor and its help text must be visible to measure their layout.');
  return { ...bounds, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
};

test.describe('Message composer accessibility', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route(`**/supportmanagement/errand/${mockErrand.errandNumber}`, jsonRoute(mockErrand));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    // All conversation requests stay local to the test, including any accidental submission.
    await page.route(`**/supportmanagement/errand/${mockErrand.id}/conversations**`, jsonRoute([]));
    await page.goto(appUrl(`/arende/${mockErrand.errandNumber}/meddelanden`));
    await expect(page.getByRole('textbox', { name: /Skriv ett meddelande/ })).toBeEditable();
  });

  for (const viewport of [
    { width: 1536, height: 960 },
    { width: 320, height: 800 },
  ]) {
    test(`Keeps the character guidance below the editor at ${viewport.width} CSS pixels`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const composer = page.getByTestId('message-composer');
      const editor = composer.getByRole('textbox', { name: /Skriv ett meddelande/ });
      const editorContainer = composer.locator('.ql-container');
      const limit = composer.getByText('Max 10000 tecken.', { exact: true });
      const count = composer.getByText('0/10000', { exact: true });

      const editorBounds = await measure(editorContainer);
      const limitBounds = await measure(limit);
      const countBounds = await measure(count);

      expect(limitBounds.y).toBeGreaterThanOrEqual(editorBounds.bottom);
      expect(countBounds.y).toBeGreaterThanOrEqual(editorBounds.bottom);
      for (const bounds of [editorBounds, limitBounds, countBounds]) {
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      }
      const messageFilter = page.getByRole('radiogroup', { name: 'Visa meddelanden' });
      for (const radio of await messageFilter.getByRole('radio').all()) {
        const bounds = await measure(radio);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      }
      const toolbar = composer.locator('.ql-toolbar');
      await expect(toolbar).toBeVisible();
      const toolbarButtons = toolbar.getByRole('button');
      expect(await toolbarButtons.count()).toBeGreaterThan(0);
      for (const button of await toolbarButtons.all()) {
        const bounds = await measure(button);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      }
      await expect(editor).toHaveAccessibleDescription('Max 10000 tecken. 0 av 10000 tecken använda.');
      await expect(editor).toHaveAttribute('aria-required', 'true');

      // Static help is exposed through the textbox description, not an extra keyboard stop.
      await expect(limit).not.toHaveAttribute('tabindex', '0');
      await expect(count).toHaveAttribute('aria-hidden', 'true');
    });
  }

  test('Updates the description and announces a crossed character limit without moving focus', async ({ page }) => {
    const composer = page.getByTestId('message-composer');
    const editor = composer.getByRole('textbox', { name: /Skriv ett meddelande/ });
    const status = composer.getByRole('status', { name: 'Meddelandestatus' });

    await page.locator('label[for="message-body"]').click();
    await expect(editor).toBeFocused();
    await editor.press('Tab');
    await expect(editor).not.toBeFocused();
    await expect(composer.getByText('Max 10000 tecken.', { exact: true })).not.toBeFocused();
    await expect(composer.getByText('0/10000', { exact: true })).not.toBeFocused();
    await editor.focus();
    await editor.fill('Hej');
    await expect(editor).toHaveAccessibleDescription('Max 10000 tecken. 3 av 10000 tecken använda.');
    await expect(composer.getByText('3/10000', { exact: true })).toBeVisible();
    await expect(status).toBeEmpty();

    await editor.fill('a'.repeat(10001));
    await expect(editor).toBeFocused();
    await expect(editor).toHaveAttribute('aria-invalid', 'true');
    await expect(editor).toHaveAccessibleDescription(
      'Max 10000 tecken. 10001 av 10000 tecken använda. Meddelandet får vara högst 10000 tecken.'
    );
    await expect(status).toHaveText('Meddelandet får vara högst 10000 tecken.');
    await expect(page.getByTestId('send-message-button')).toBeDisabled();

    await editor.fill('a'.repeat(10000));
    await expect(editor).toHaveAttribute('aria-invalid', 'false');
    await expect(editor).toHaveAccessibleDescription('Max 10000 tecken. 10000 av 10000 tecken använda.');
    await expect(status).toBeEmpty();
    await expect(page.getByTestId('send-message-button')).toBeEnabled();
  });

  test('formats selected text and manages the link dialog entirely with accessible controls', async ({ page }) => {
    const composer = page.getByTestId('message-composer');
    const editor = composer.getByRole('textbox', { name: /Skriv ett meddelande/ });
    const toolbar = composer.getByRole('group', { name: 'Textformatering' });
    await editor.fill('Text att formatera');
    await editor.press('ControlOrMeta+A');
    await toolbar.getByRole('button', { name: 'Fet', exact: true }).click();
    await expect(editor.locator('strong')).toHaveText('Text att formatera');
    await expect(toolbar.getByRole('button', { name: 'Fet', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await toolbar.getByRole('button', { name: 'Punktlista', exact: true }).click();
    await expect(editor.locator('li[data-list="bullet"]')).toHaveText('Text att formatera');

    const link = toolbar.getByRole('button', { name: 'Länk', exact: true });
    await link.click();
    const dialog = page.getByRole('dialog', { name: 'Redigera länk' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Redigera länk' })).toBeFocused();
    await dialog.getByRole('textbox', { name: 'Länkadress' }).fill('https://example.com');
    await dialog.getByRole('button', { name: 'Spara länk' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(link).toBeFocused();
    await expect(editor.locator('a')).toHaveAttribute('href', 'https://example.com');

    await link.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(link).toBeFocused();
    await editor.focus();
    await editor.press('Tab');
    await expect(editor).not.toBeFocused();
  });
});
