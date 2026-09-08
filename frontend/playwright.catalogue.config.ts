import { defineConfig, devices } from '@playwright/test';

const port = '3100';
const apiPort = '3101';
const basePath = '/portal';
const sessionCookieName = 'katla.catalogue.sid';

export default defineConfig({
  testDir: './e2e/catalogue',
  outputDir: './test-results-catalogue',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}${basePath}`,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'catalogue-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/fixture-server.mjs',
      env: {
        APP_MODE: 'catalogue',
        KATLA_ID: '',
        E2E_API_PORT: apiPort,
        E2E_FRONTEND_ORIGIN: `http://localhost:${port}`,
        NEXT_PUBLIC_SESSION_COOKIE_NAME: sessionCookieName,
      },
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: process.env.CI ? 'node .next/standalone/frontend/server.js' : 'yarn dev',
      env: {
        APP_MODE: 'catalogue',
        KATLA_ID: '',
        PORT: port,
        NEXT_DIST_DIR: '.next-catalogue',
        NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}/api`,
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_SESSION_COOKIE_NAME: sessionCookieName,
      },
      url: `http://localhost:${port}${basePath}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
