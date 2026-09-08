# Skapa en ny Katla

En vanlig Katla består av en liten definition, testexempel och miljöns driftvärden. Frontend, backend, Astryx, schemaformulär, inloggning, utkast och inskickning återanvänds. Börja här; kopiera ingen appmapp.

## Snabbstart

Ordna den gemensamma utvecklingsmiljön enligt [README](../README.md) en gång. Kör sedan från reporoten:

```sh
yarn katla:new it-bestallning --name "IT-beställning" --schema it-bestallning-arendeuppgifter
yarn katla:check it-bestallning
```

Kommandot skapar `katlor/src/it-bestallning/definition.ts`, `example.json`, en verksamhets-README och `deploy/it-bestallning.policy-entry.example.json`. Det registrerar definitionen i `katlor/src/index.ts` och avvisar befintliga filer. `example.json` innehåller ett fungerande litet exempel med rubrik och beskrivning. Ersätt det med uppgifter som representerar verksamheten; kommandot publicerar inga scheman eller katalogposter.

Definitionen ser ut så här:

```ts
import type { KatlaDefinitionInput } from '../definition';

export const itBestallningKatla = {
  id: 'it-bestallning',
  applicationName: 'IT-beställning',
  flow: 'schema',
  forms: [{ schemaName: 'it-bestallning-arendeuppgifter' }],
} satisfies KatlaDefinitionInput;
```

Editorn visar syfte, tillåtna värden och standardvärden från [definitionskontraktet](../katlor/src/definition.ts). `katla:check` visar den fullständiga definitionen och dess innehållsrevision samt provar att giltiga testuppgifter accepteras och ogiltiga uppgifter avvisas. Uppgifter som inte kontrollerats anges uttryckligen i utdata.

Ordna därefter följande för den nya Katlan:

| Uppgift | Ansvar och plats |
| --- | --- |
| Fält, validering och hjälptexter | Verksamheten och schemaägaren publicerar JSON-schema och UI-schema i JSON Schema-tjänsten. Definitionsfilen refererar till schemanamnet. |
| Mottagning | Draken-/SupportManagement-ägaren ordnar namespace och verifierar rapportör, statusar, titel, prioritet, kanal och resolution. |
| Åtkomst | Identitetsägaren ordnar gruppmedlemskap; drift lägger id, adress och tillåtna grupper i den gemensamma katalogpolicyn. |
| Lokal/testanslutning | Utvecklaren får API-prenumerationer, SAML-inställningar och godkända testuppgifter. Hemligheter ligger utanför Git. |
| Verifiering | Utvecklaren provar klienten; mottagaren verifierar ett riktigt testärende i Draken före lansering. |

Kopiera [instansmallen](../deploy/instance.env.example) till exempelvis `.katla/it-bestallning.env`, ange dess egna värden och komplettera med anslutnings-/SAML-värdena från backendmallen. Relativa `KATLA_CATALOGUE_FILE`-sökvägar i en envfil räknas från den filens katalog. Det gör att hemlighetsfilen kan ligga utanför repot. De publika värdena och den gemensamma backendens värden kan anges i samma lokala fil; endast `NEXT_PUBLIC_*` byggs in i webbläsaren.

```sh
yarn katla:check it-bestallning --env-file .katla/it-bestallning.env
yarn katla:dev it-bestallning --env-file .katla/it-bestallning.env
```

Startkommandot startar befintlig frontend och backend och stänger båda när du avbryter. Ange `--frontend-port` och `--backend-port` om standardportarna 3000/3001 är upptagna. Justera också API-adress, SAML-callbacks, origin och katalogpost till portarna du använder. Lokala frontendinstanser får automatiskt var sin `.next-<id>`-katalog; alla använder samma källkod. Proxykonfiguration bakas in per Next-bygge utan en gemensam genererad mellanfil. En uttrycklig `--env-file` ersätter standardfilerna; kommandot avvisar en fil som väljer en annan instans för att undvika fel namespace.

## Vad ändrar jag var?

| Ändring | Ägare |
| --- | --- |
| Fält och validering | JSON-schema i schematjänsten |
| Ordning, widget och hjälptext | UI-schema i schematjänsten |
| Appnamn, schemareferenser, utkast eller andra befintliga produktval | `katlor/src/<id>/definition.ts` |
| URL, namespace, kommun, grupper, certifikat och hemligheter | Instansens driftskonfiguration och gemensamma katalogpolicy |
| En regel som kräver rapporttyp, plats eller parter | `@katla/definitions/avvikelse`; flödets komponenter finns i `frontend/src/flows/avvikelse` |
| Gemensam sparning och inskickning | `frontend/src/contexts/errand-submission-provider.tsx` med formulärmedlemskap och validering i `frontend/src/flows` |
| Gemensam design eller formulärhantering | Befintligt tema respektive schema-/formulärägare i frontend |

`KatlaDefinitionInput` är den lilla författartypen. `KatlaDefinition` är det fullständiga validerade resultatet som frontend och backend använder. Standardvärden finns på ett enda ställe i kontraktet; ange bara avvikelser. Ett nytt produktval behöver en verklig konsument, dokumentation och beteendetest. Ett nytt formulärfält behöver normalt ingen ny TypeScript-flagga.

Standardflödet är rapportör → schemafält → sammanfattning → inskickning → kvitto. Det kräver inga avvikelsebegrepp. Övriga parter är uttryckligen ett avvikelseval. För flera formulär listar definitionen scheman i ordning; lägg representativa scenarier för samtliga i flödets tester. Den lilla `example.json`-kontrollen verifierar filens representativa schema, medan anslutningskontrollen hämtar samtliga refererade scheman.

Byt aldrig Katla-id för en instans som har sparade uppgifter. Nya formulär hämtar senaste schemaversionen och binds sedan till dess immutabla `schemaId`. Sparade ärenden behåller sitt schema-id. Testa ett historiskt utkast innan schemalistan ändras; saknade äldre scheman får inte lösas genom att märka om gammal data. Återställ schematjänstens tillgänglighet eller tidigare aktivering enligt schemaägarens beslut.

## Mina Katlor och åtkomst

Den gemensamma policyfilen innehåller `revision`, `catalogueUrl`, `sessionMaxAgeSeconds` och `applications`. En applikationspost anger `id`, `url`, `published` och `allowedGroups`. [Produktionsmallen](../deploy/catalogue.example.json) nekar åtkomst tills grupper har fyllts i och är opublicerad som utgångsläge.

Samma policyfil levereras till kataloginstansen och alla Katlor genom `KATLA_CATALOGUE_FILE`. `AUTHORIZED_GROUPS` är ersatt och får inte ligga kvar. `published` styr synlighet i Mina Katlor; `allowedGroups` styr appåtkomst också via direktlänk och API. En opublicerad app kan alltså provas via direktlänk av en tillåten grupp. Tom grupplista nekar alla. Katalogen skickar bara tillåtna publicerade poster till webbläsaren.

Katalogen kör med `APP_MODE=catalogue` utan `KATLA_ID`, namespace eller ärende-API-hemligheter. Varje Katla kör med `APP_MODE=katla` och sitt id. Sessionskakan heter `katla.<id>.sid` respektive `katla.catalogue.sid`; `NEXT_PUBLIC_SESSION_COOKIE_NAME` ska stämma med serverns `SESSION_COOKIE_NAME`. Cookie-path ska täcka både frontend och dess API, normalt appens monteringsrot. Ange aldrig en gemensam domänkaka för alla instanser.

Appåtkomst ger inte tillgång till alla ärenden: backend avgränsar rapportörsvyn till den verifierade användarens `reporterUserId`. En person vald som rapportör i formuläret är en part i ärendet, inte ett sätt att byta användaridentitet. SAML är ägare till verifierade gruppclaims; gamla gruppuppgifter kräver ny inloggning senast efter policyfilens `sessionMaxAgeSeconds`.

## Läsande anslutningskontroll

Logga in i rätt testinstans. Exportera en Playwright `storageState`-fil med just den instansens session. Ett sätt är att öppna en lokal webbläsare med Playwright, logga in och sedan stänga fönstret så tillståndet sparas:

```sh
umask 077
yarn workspace katla-web-app playwright open --save-storage=../.katla/test.session.json https://it-bestallning.test.example.invalid
chmod 600 .katla/test.session.json
yarn katla:check it-bestallning --connected \
  --api-url https://it-bestallning.test.example.invalid/api \
  --session-file .katla/test.session.json
```

`--api-url` och `--session-file` måste anges uttryckligen. Sessionfilen är ignorerad av Git, ska vara läsbar enbart för ägaren och kan tas bort efter kontrollen. Verktyget följer inga omdirigeringar, skickar endast instansens matchande cookie och skriver inte ut cookies eller tokens.

Kontrollen läser `/app-context`, `/applications`, senaste schema för varje referens, samma schema genom dess immutabla id samt metadata för `DRAFT`, `NEW`, `SOLVED` och rollen `REPORTER`. Fel id/revision, obehörig anslutning och saknade schema-/metadatavärden stoppar kontrollen. Katalogläge läser bara identitet och katalog. Kontrollen skapar eller ändrar inga ärenden. Kanal/resolution, verksamhetslabels, verklig IdP, gamla utkast och mottagningen i Draken behöver dessutom verifieras av ansvariga i testmiljön.

## Bygge och tester

```sh
yarn katla:build it-bestallning --env-file .katla/it-bestallning.env
yarn standalone:prepare
yarn standalone:check
yarn test:platform
yarn type-check
yarn lint:strict
yarn workspace backend test
yarn workspace katla-web-app test
```

Byggkommandot bygger definitionspaketet, den gemensamma backendkoden och vald frontend. `.katla/<id>.build.json` dokumenterar id, definitionsrevision och publika byggvärden. Ett Next-bygge motsvarar en instans och målmiljö. En ny image behövs när definition eller kod ändras. Befintligt schema/UI-schema kan publiceras separat, med schemaägarens egna kontroller.

`schema-test` och `avvikelse-test` är uttryckliga testdefinitioner. Lokala definitionstest körs med `yarn katla:check schema-test --test --policy deploy/catalogue.test.example.json`. Testdefinitioner kräver `--test`; servern kräver `ALLOW_TEST_KATLA=true` utanför produktion och katalogpolicyn avvisar publicering av testdefinitioner. Browserproven använder kontrollerade fixtures; de bevisar inte en verklig anslutning.

```sh
yarn workspace katla-web-app playwright install chromium
yarn workspace katla-web-app playwright test
yarn workspace katla-web-app playwright test --config playwright.schema.config.ts
yarn workspace katla-web-app playwright test --config playwright.catalogue.config.ts
```

Se [drift och återställning](katla-operations.md) för images, gemensam policy, releasekontroller och återstående extern acceptans.

## Felsökning

| Fel | Nästa åtgärd |
| --- | --- |
| Unknown Katla id | Kontrollera id och registreringen i `katlor/src/index.ts`; kör `yarn definitions:build`. |
| Test definition / får aldrig publiceras | Använd explicit lokal/testkörning och håll testdefinitionen opublicerad; skapa en verklig definition för verksamheten. |
| Schema saknas | Kontrollera publicerat namn, kommun, API-prenumeration och schema-id. Behåll gammal data. |
| Metadata saknar status/roll | Låt mottagaren komplettera rätt namespace. |
| 401 eller upprepad inloggning | Kontrollera sessionens ålder, cookie-namn/path, HTTPS och SAML-callbacks. |
| 403 eller tom katalog | Kontrollera verifierade IdP-grupper mot samma policyfil i portal och app; kontrollera publiceringsstatus. |
| Frontend/backend revision skiljer sig | Bygg eller återställ matchande release och definition; byt inte bara en runtimevariabel på en färdig frontendimage. |
| En ny Katla behöver ändra flera gemensamma komponenter | Stanna upp vid ägargränsen: undersök befintligt flöde innan fler flaggor eller kopior införs. |

## Praktiskt introduktionstest

En utvecklare som inte byggt basen ska följa denna guide från ren klon och införa nästa riktiga standard-Katla. Anteckna aktiv arbetstid, väntan på externa förutsättningar, felsteg och frågor. Personen ska kunna förklara var fält, appval och verksamhetsregler hör hemma samt få ett verifierat testärende i Draken. Detta moment är ännu en extern förutsättning; lokal kodgenerering eller mocktester ersätter inte försöket.
