import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Dev-servern läser .env via Next, så konfigurationen måste läsa samma fil för att
// baseURL och funktionsflaggorna nedan ska beskriva appen som faktiskt testas.
// dotenv skriver inte över redan satta variabler, så CI:s explicita värden vinner.
dotenv.config({ path: '.env', quiet: true });

const PORT = process.env.PORT || '3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// appconfig läser flaggan som strikt === 'true', så ett utelämnat värde är inte
// neutralt — det stänger av funktionen. Att bara avvisa 'false' släppte därför
// igenom en oansatt variabel, och de tre scenarier som använder Övriga parter
// föll på element som aldrig renderats i stället för på ett begripligt fel.
if (process.env.NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE !== 'true') {
  throw new Error(
    'Playwright requires NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true because the registration scenarios exercise other stakeholders. Add it to frontend/.env (the dev server reads the same file).'
  );
}

if (process.env.NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO === 'true') {
  throw new Error(
    'Playwright requires NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false because the registration scenarios exercise stakeholder contact fields.'
  );
}

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
  webServer: {
    // CI återanvänder det färdiga bygget och dess statiska filer från föregående steg.
    // Då kan en dev-kompilering inte starta om servern mitt under navigationstesterna.
    command: process.env.CI ? 'node .next/standalone/server.js' : 'yarn dev',
    // Språkroutern normaliserar loopback till localhost. Samma värd behövs här
    // så att en intern rewrite inte blir en extern proxy tillbaka till servern.
    env: { HOSTNAME: 'localhost', PORT },
    url: `http://localhost:${PORT}${BASE_PATH}/login`,
    stdout: 'pipe',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
