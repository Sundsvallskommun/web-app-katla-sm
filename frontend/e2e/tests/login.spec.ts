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

  test('uses the readable theme font without requiring a remote font download', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    const typography = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return { family: style.fontFamily, size: parseFloat(style.fontSize) };
    });
    expect(typography.family).toContain('system-ui');
    expect(typography.size).toBeGreaterThanOrEqual(24);
    await expect(page.getByTestId('login-button')).toHaveCSS('font-family', typography.family);
  });
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Uses the readable theme foreground for the logo in ${colorScheme} mode`, async ({ appUrl, page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(appUrl('/login'));
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      const foreground = await heading.evaluate((element) => getComputedStyle(element).color);
      const logo = page.getByRole('img', { name: 'Sundsvalls kommun', exact: true });
      await expect(logo).toBeVisible();
      await expect(logo).toHaveCSS('background-color', foreground);
      await expect(logo).toHaveCSS('mask-image', /SK_logo\.svg/);
    });
  }
});
