import { expect, test } from '../utils/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.goto(appUrl('/login'));
  });

  test('should render correct html structure', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Välj hur du vill logga in');
    const loginButton = page.getByTestId('login-button');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    await expect(loginButton).toContainText('Logga in');
    await loginButton.click();
  });

  test('loads the actual heading font under the configured application path', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const fonts = await page.evaluate(async () => {
      const loaded = await document.fonts.load('700 24px Raleway');
      return loaded.map((font) => ({ family: font.family, status: font.status }));
    });

    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.every((font) => font.family === 'Raleway' && font.status === 'loaded')).toBe(true);
  });
});
