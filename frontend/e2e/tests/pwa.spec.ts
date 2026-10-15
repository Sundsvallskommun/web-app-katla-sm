import { expect, test } from '../utils/test';

interface Manifest {
  scope: string;
  start_url: string;
  icons: { src: string }[];
}

test.describe('Installable app', () => {
  test('Links a manifest whose icons and start page live under the base path', async ({ appUrl, page, request }) => {
    await page.goto(appUrl('/login'));

    const manifestHref = (await page.locator('link[rel="manifest"]').getAttribute('href')) ?? '';
    expect(manifestHref).not.toBe('');
    const manifestUrl = new URL(manifestHref, page.url());

    const response = await request.get(manifestUrl.href);
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as Manifest;

    const scope = new URL(appUrl('/')).pathname;
    expect(manifest.scope).toBe(scope);
    expect(manifest.start_url.startsWith(scope)).toBe(true);

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(new URL(icon.src, manifestUrl).href);
      expect(iconResponse.ok(), icon.src).toBe(true);
      expect(iconResponse.headers()['content-type'], icon.src).toBe('image/png');
    }
  });

  test('Declares a theme color and an iOS home screen icon', async ({ appUrl, page, request }) => {
    await page.goto(appUrl('/login'));

    // En temafärg per färgschema, eftersom sidhuvudet byter färg mellan ljust och mörkt läge.
    const themeColors = page.locator('meta[name="theme-color"]');
    await expect(themeColors).toHaveCount(2);
    for (const themeColor of await themeColors.all()) {
      await expect(themeColor).toHaveAttribute('content', /^#[0-9a-f]{6}$/i);
      await expect(themeColor).toHaveAttribute('media', /prefers-color-scheme: (light|dark)/);
    }

    const appleIconHref = (await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')) ?? '';
    expect(appleIconHref).not.toBe('');
    const appleIconResponse = await request.get(new URL(appleIconHref, page.url()).href);
    expect(appleIconResponse.ok()).toBe(true);
  });

  test('Serves the service worker and offline page without redirecting to login', async ({ appUrl, request }) => {
    for (const path of ['/sw.js', '/offline.html']) {
      const response = await request.get(appUrl(path), { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
    }
  });
});
