import { defineConfig, devices } from '@playwright/test';

const port = '3200';
const apiPort = '3201';
const cookieName = 'katla.schema-test.sid';
export default defineConfig({
  testDir: './e2e/schema',
  outputDir: './test-results-schema',
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    testIdAttribute: 'data-cy',
  },
  projects: [
    { name: 'schema-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'schema-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node e2e/fixture-server.mjs',
      env: {
        APP_MODE: 'katla',
        KATLA_ID: 'schema-test',
        E2E_API_PORT: apiPort,
        E2E_FRONTEND_ORIGIN: `http://localhost:${port}`,
        NEXT_PUBLIC_SESSION_COOKIE_NAME: cookieName,
      },
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: process.env.CI ? 'node .next/standalone/frontend/server.js' : 'yarn dev',
      env: {
        APP_MODE: 'katla',
        KATLA_ID: 'schema-test',
        PORT: port,
        HOSTNAME: 'localhost',
        NEXT_DIST_DIR: '.next-schema',
        NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}/api`,
        NEXT_PUBLIC_BASE_PATH: '',
        NEXT_PUBLIC_SESSION_COOKIE_NAME: cookieName,
      },
      url: `http://localhost:${port}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
