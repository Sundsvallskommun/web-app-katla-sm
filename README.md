# Katla – gemensam bas för interna ärendeappar

Katlor delar frontend, backend, Astryx och ärendehantering. Varje Katla har en liten typad definition och egna driftvärden. Mina Katlor är den gemensamma inloggade startsidan och visar de publicerade appar användaren har rätt till.

**[Skapa en ny Katla](docs/adding-a-katla.md)** · [Drift, images och återställning](docs/katla-operations.md) · [Granskningsunderlag och verifiering](docs/katla-implementation-review.md) · [Bakgrund och införandeplan](docs/katla-monorepo-plan.md)

## Utveckling

Använd Node 22.18.0 enligt `.nvmrc` och Yarn Classic 1.22.22. Paketens `engines` anger stödda Node-versioner. Installera från roten; `frontend/`, `backend/` och `katlor/` är workspaces med en gemensam låsfil.

```sh
nvm use
yarn install --frozen-lockfile
cp frontend/.env-example frontend/.env
cp backend/.env.example.local backend/.env.development.local
```

Installationen bygger definitionspaketet. Om du använder `--ignore-scripts`, kör också `yarn definitions:build`. Frontend och backend deklarerar fortfarande sina egna beroenden. TypeScript 5.9.3 är uttryckligt pinnad också i roten så direktkörda verktyg inte väljer en generators interna kompilator.

Fyll i backendens anslutnings- och SAML-inställningar och lokala katalogpolicy. `SECRET_KEY` är avsiktligt tom: generera med `openssl rand -hex 32`. Använd organisationens godkända API-klient och certifikat. Backendmallen innehåller ett avsiktligt incheckat lokalt exempelnyckelpar, inte drifthemligheter. Egna `.env`-filer, `cert/` och sessionsexporter ingår inte i Git eller Dockerkontexten.

```sh
yarn katla:check avvikelse
yarn katla:dev avvikelse
```

Startkommandot kör gemensam frontend och backend. Vid separata instanser används `--env-file <fil>`; guiden visar hela arbetsgången inklusive namespace, scheman, policy, sessioner och anslutningskontroll. Ange egna publicerade schema- och driftvärden innan du provar verklig ärendehantering. Browserproven nedan använder avgränsade fixtures och kräver ingen verklig IdP.

## Hitta rätt ägare

| Jag arbetar med | Börja här |
| --- | --- |
| Ny Katla, appnamn, schemareferenser, produktval | `katlor/src/<id>/definition.ts` och [introduktionsguiden](docs/adding-a-katla.md) |
| Typer och standardvärden | `katlor/src/definition.ts` |
| Formulärfält och UI-schema | JSON Schema-tjänsten; lokala filer är enbart testunderlag |
| Formulärmedlemskap och validering / avvikelsens specialregler | `frontend/src/flows/errand-forms.ts`, `validate-errand.ts` / `frontend/src/flows/avvikelse` |
| Gemensam sparning och inskickning på mobil och desktop | `frontend/src/contexts/errand-submission-provider.tsx` |
| Delade schema- eller avvikelseregler | Definitionspaketets uttryckliga delmoduler; inga React- eller serverhemligheter |
| Design | Befintligt Katla-tema och Astryx |
| Behörighet och katalog | `backend/src/config/catalogue-policy.ts`, `katla-config.ts` och `KATLA_CATALOGUE_FILE` |
| HTTP/API och ärendegränser | Befintliga backendcontrollers och `errand-submission.service.ts` |

Appåtkomst och ärendetillgång kontrolleras separat på servern. Katalogläge registrerar endast identitet, katalog och hälsoendpoints. Det kräver inga ärende-API-hemligheter.

## Kommandon

```sh
yarn katla:new it-bestallning --name "IT-beställning"
yarn katla:check it-bestallning
yarn katla:dev it-bestallning --env-file .katla/it-bestallning.env
yarn katla:build it-bestallning --env-file .katla/it-bestallning.env
yarn katla:check --help
```

`katla:check --connected` gör endast läsande anrop med en uttryckligt vald testbackend och sessionfil. Det jämför definitioner och hämtar scheman/metadata; mottagningen i Draken verifieras separat. Se guiden för säkert sessionsexportexempel.

Frontendens dev-, build- och analyskommandon använder uttryckligen Webpack för Next 16.2.11. Behåll `--webpack` också vid direkta Next-kommandon; det befintliga valet minskar risken att återinföra den tidigare incidenten med många byggprocesser. Ett frontendbygge väljer en Katla eller katalogen och en målmiljö. Backendimagen kan återanvändas mellan instanser.

## Tester och kvalitet

```sh
yarn test:platform
yarn type-check
yarn lint:strict
yarn format:platform:check
yarn workspace backend format:check
yarn workspace katla-web-app format:check
yarn test
```

Backendtester sätter sin miljö deterministiskt i testsetup. Frontendtester väljer explicit testdefinition; produktion har inga runtime-flaggor som ändrar produktval.

```sh
yarn workspace katla-web-app playwright install chromium
yarn workspace katla-web-app playwright test
yarn workspace katla-web-app playwright test --config playwright.schema.config.ts
yarn workspace katla-web-app playwright test --config playwright.catalogue.config.ts
```

De tre browserkonfigurationerna provar avvikelse, ett standardformulär utan avvikelsebegrepp och Mina Katlor. Lokal testserver startas av Playwright. CI kör färdiga standalone-byggen, vars assets kopieras med `yarn standalone:prepare`; `yarn standalone:check` verifierar paketet utanför källrepot. CI behåller även bygg- och artefaktkontroller i RHEL 8.10/UBI.

Bygg-/testkontroller är separata från verksamhetsacceptans. Riktig SSO, gruppändringar, namespace-/rollkontrakt, historiska utkast, mottagning i Draken och introduktion med en annan utvecklare ska verifieras i testmiljön enligt [driftguiden](docs/katla-operations.md).

## API-anslutningar

Aktuella tjänstenamn och versioner ägs av `backend/src/config/api-config.ts`. Katla-läge använder SupportManagement, JSON Schema, Citizen och Employee där flödet behöver dem; prenumerationerna måste motsvara denna konfiguration. SupportManagement har för närvarande en uttrycklig sprintalias i kod. Katalogläge använder endast SAML och katalogpolicyn.

## Komponenter och tema

Katlas tema finns i `frontend/src/theme/katla.ts`. Efter ändringar, kör `yarn workspace katla-web-app theme:build` och `yarn workspace katla-web-app theme:check`. Filerna i `frontend/src/theme/generated/` versionshanteras och genereras med kommandot; ändra dem inte för hand. Använd Astryx komponentprops och tematokens. Vid biblioteksuppgradering verifieras formulär, språk, routing och tillgänglighet.
