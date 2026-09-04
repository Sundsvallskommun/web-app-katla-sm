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
- `SAML_PRIVATE_KEY` och `SAML_PUBLIC_KEY` lämnas tomma i mallen. Om din lokala SAML-anslutning behöver ett nyckelpar, generera ett eget från `backend/`:

  ```sh
  mkdir -p cert
  (umask 077 && openssl genrsa -out cert/local-saml-key.pem 4096)
  openssl req -new -x509 -key cert/local-saml-key.pem -out cert/local-saml-cert.pem -sha256 -days 365 -subj '/CN=localhost'
  ```

  Kopiera nyckelfilens innehåll till `SAML_PRIVATE_KEY` och certifikatets innehåll till `SAML_PUBLIC_KEY`. Omslut varje värde med dubbla citattecken; dotenv stöder radbrytningar inom dessa. `cert/` och `.env.development.local` är git-ignorerade och uteslutna från Docker-byggets filer. Registrera rätt certifikat hos din IDP när det behövs. Driftmiljöer ska ha egna nycklar och certifikat.

Vid uppgradering: kontrollera driftmiljöns `SECRET_KEY` före deployment. Värden kortare än 32 tecken måste ersättas för att servern ska starta; byte av sessionshemlighet loggar ut befintliga sessioner. Den tidigare exempelhemligheten och privata nyckeln är offentliga. Om någon miljö har återanvänt dem behöver de ersättas där, inklusive registrerat SAML-certifikat. Enbart ändringen av exempelfilen roterar inga driftvärden.

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

Testerna körs mot en produktionsbyggd app (Playwright startar servern själv), alternativt mot en redan startad dev-server:

```
yarn build && yarn e2e     # bygg och kör headless
yarn e2e:ui                # interaktivt UI-läge
```

Obs: e2e-testerna förutsätter att `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true` och `NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false` är satta i `.env` vid byggtillfället (se `.github/workflows/ci.yml`).

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
