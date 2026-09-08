# Sundsvalls Kommun Katla supportmanagement

## APIer som används

Dessa APIer används i projektet, applikationsanvändaren i WSO2 måste prenumerera på dessa.

| API               | Version |
| ----------------- | ------: |
| SupportManagement |    10.7 |
| Citizen           |     3.0 |
| Employee          |     2.0 |
| SimulatorServer   |     2.0 |


## Utveckling

### Krav

- Node 22.18.0 (använd den pinnade versionen i `.nvmrc`; `package.json` anger det stödda intervallet)
- Yarn

### Steg för steg

1. Klona ner repot.

```
git clone git@github.com:Sundsvallskommun/web-app-katla-sm.git
```

2. Installera dependencies för både `backend` och `frontend`

```
cd frontend
yarn install

cd backend
yarn install
```

3. Skapa .env-fil för `frontend`

```
cd frontend
cp .env-example .env
```

Redigera `.env` vid behov.

4. Skapa .env-fil för `backend`

```
cd backend
cp .env.example.local .env.development.local
```

redigera `.env.development.local` för behov. URLer, nycklar och cert behöver fyllas i korrekt.

- `SECRET_KEY` lämnas avsiktligt tom i mallen. Kör `openssl rand -hex 32` lokalt och kopiera det genererade värdet till `SECRET_KEY` i din `.env.development.local`. Återanvänd inte någon annans sessionshemlighet. Servern avvisar tomma värden, värden kortare än 32 tecken, blanksteg och vanliga platshållare.
- `CLIENT_KEY` och `CLIENT_SECRET` måste fyllas i för att APIerna ska fungera, du måste ha en applikation från WSO2-portalen som abonnerar på de microtjänster du anropar
- `SAML_ENTRY_SSO` behöver pekas till en SAML IDP
- `SAML_IDP_PUBLIC_CERT` ska stämma överens med IDPens cert
- `SAML_PRIVATE_KEY` och `SAML_PUBLIC_KEY` innehåller avsiktligt ett exempelnyckelpar för lokal utveckling, med ett självsignerat localhost-certifikat. Det behålls som lokal testdata och är ingen drifthemlighet. Använd egna nycklar och certifikat för en riktig IDP-anslutning. `cert/` och `.env.development.local` är git-ignorerade och uteslutna från Docker-byggets filer.

Vid uppgradering: kontrollera driftmiljöns `SECRET_KEY` före deployment. Värden kortare än 32 tecken måste ersättas för att servern ska starta; byte av sessionshemlighet loggar ut befintliga sessioner. Om någon miljö har återanvänt den tidigare exempelhemligheten behöver den ersättas där. Enbart ändringen av exempelfilen roterar inga driftvärden.

## Byggverktyg

Frontendens `yarn dev`, `yarn build`, `yarn build:test` och analyskommandon använder uttryckligen Webpack. `yarn build:webpack` är ett alias till `yarn build` och kör därmed samma förberedelser. Playwright och CI använder dessa gemensamma skript.

Detta är en tillfällig åtgärd efter en lokal incident med ett skenande antal Node-processer. Turbopacks hjälpprocesser är det främsta spåret, men exakt orsak är inte fastställd. Undvik direkta `next dev`/`next build` utan `--webpack`, eftersom Next 16 annars väljer Turbopack. Den uttryckliga projektroten i `next.config.js` behålls. Beroendeversioner, applikationsflöden och API-kontrakt påverkas inte av valet av byggverktyg.

## Komponenter och tema

Frontend använder Astryx. Katlas tema definieras i `frontend/src/theme/katla.ts`.
Efter ändringar i temat eller uppgradering av Astryx, kör från `frontend/`:

```sh
yarn theme:build
yarn theme:check
```

Filerna i `frontend/src/theme/generated/` används av appen och versionshanteras,
men ska genereras med kommandot ovan. Ändra dem inte för hand.
Använd bibliotekets komponentprops och tematokens för färger, avstånd och typografi.
Vid biblioteksuppgradering behöver även appens formulär-, språk-, routing- och
tillgänglighetstester köras.

## Tester

### Frontend (`cd frontend`)

Enhetstester körs med [Vitest](https://vitest.dev):

```
yarn test              # kör en gång
yarn test:watch        # watch-läge
yarn test:coverage     # med kodtäckning
```

E2e-tester körs med [Playwright](https://playwright.dev). Första gången behöver webbläsaren installeras:

```
yarn playwright install chromium
```

Lokalt startar Playwright en dev-server via `yarn dev`, alternativt återanvänder en redan startad lokal dev-server. I GitHub CI körs testerna mot det färdiga produktionsbyggets standalone-server; arbetsflödet kopierar dess `public` och `.next/static` före start. Därmed görs ingen ny kompilering under browserkörningen.

```
yarn e2e                  # kör headless lokalt
yarn e2e:ui                # interaktivt UI-läge
```

Obs: e2e-testerna förutsätter att `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true` och `NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false` är satta i `.env` lokalt och vid byggtillfället i CI (se `.github/workflows/ci.yml`).

### Backend (`cd backend`)

Tester körs med Vitest. Testmiljön sätts deterministiskt i `src/tests/setup.ts`; ingen lokal test-envfil krävs:

```
yarn test              # kör en gång
yarn test:watch        # watch-läge
```

## Lint och formatering

Båda paketen använder en strikt, typmedveten ESLint-uppsättning enligt [web-app-starter](https://github.com/Sundsvallskommun/web-app-starter) (typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, `simple-import-sort`, `unused-imports`, `no-console`). Inline `eslint-disable`-kommentarer är avstängda — åtgärda koden i stället.

```
yarn lint              # lint
yarn lint:fix          # lint med autofix
yarn lint:strict       # som CI: 0 varningar tillåtna
yarn format            # prettier --write
yarn format:check      # som CI: verifiera formatering
```

## CI

GitHub Actions-flödet i `.github/workflows/ci.yml` kör strikt lint, formatkontroll, type-check och enhetstester för både frontend och backend samt Playwright e2e-tester vid pull requests och push till `main`/`develop`.

Skärmbilder och axe-resultat sparas som tillfälliga CI-artifacts under körningen.
De ska inte kopieras in i repot. Playwrights HTML-rapport laddas upp när tester misslyckas.
