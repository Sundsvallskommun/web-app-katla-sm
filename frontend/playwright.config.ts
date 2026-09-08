import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { getKatlaDefinition } from '@katla/definitions';

// Dev-servern läser .env via Next, så konfigurationen måste läsa samma fil för att
// baseURL och funktionsflaggorna nedan ska beskriva appen som faktiskt testas.
// dotenv skriver inte över redan satta variabler, så CI:s explicita värden vinner.
dotenv.config({ path: '.env', quiet: true });

const PORT = process.env.PORT || '3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const definition = getKatlaDefinition('avvikelse-test', { allowTestDefinitions: true });
if (!definition.features.otherPartiesDisclosure || definition.features.reducedStakeholderInfo) {
  throw new Error('The Avvikelse browser fixture must include other parties and full stakeholder fields.');
}
const sessionCookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'katla.avvikelse-test.sid';
const apiPort = process.env.E2E_API_PORT || '3001';
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // En worker begränsar minnestrycket och håller samma testordning lokalt och i CI.
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'on-failure' }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    // Missing or covered controls should fail quickly instead of consuming the full test timeout.
    actionTimeout: 10_000,
    // Projektet använder data-cy-attribut som testselektorer
    testIdAttribute: 'data-cy',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Motsvarar Cypress viewport "macbook-16"
        viewport: { width: 1536, height: 960 },
      },
    },
  ],
  webServer: [
    {
      command: 'node e2e/fixture-server.mjs',
      env: {
        APP_MODE: 'katla',
        KATLA_ID: 'avvikelse-test',
        E2E_API_PORT: apiPort,
        E2E_FRONTEND_ORIGIN: `http://localhost:${PORT}`,
        NEXT_PUBLIC_SESSION_COOKIE_NAME: sessionCookieName,
      },
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: false,
    },
    {
      // CI återanvänder det färdiga bygget och dess statiska filer från föregående steg.
      // Då kan en dev-kompilering inte starta om servern mitt under navigationstesterna.
      command: process.env.CI ? 'node .next/standalone/frontend/server.js' : 'yarn dev',
      // Språkroutern normaliserar loopback till localhost. Samma värd behövs här
      // så att en intern rewrite inte blir en extern proxy tillbaka till servern.
      env: {
        HOSTNAME: 'localhost',
        PORT,
        APP_MODE: 'katla',
        KATLA_ID: 'avvikelse-test',
        NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}/api`,
        NEXT_PUBLIC_CATALOGUE_URL: 'http://localhost:3100/portal',
        NEXT_PUBLIC_SESSION_COOKIE_NAME: sessionCookieName,
      },
      url: `http://localhost:${PORT}${BASE_PATH}/login`,
      stdout: 'pipe',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
