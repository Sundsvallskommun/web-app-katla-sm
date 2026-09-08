# Katla-plattformen – underlag för granskning

Uppdaterad: 2026-09-08. Implementation i separat worktree på `feature/katla-platform`. Inga images är publicerade och ingen miljö är driftsatt. Verklig IdP-/Draken-acceptans och introduktion med en annan utvecklare återstår.

## Resultat

En ny Katla med standardflödet läggs till med en liten typad definition, en registrering och verksamhetsexempel. Kommandot skapar dessa filer. Frontend, backend, design, schemaformulär och ärendehantering delas. Verksamheten behöver fortfarande egna publicerade scheman, namespace, åtkomstgrupper och driftvärden.

```sh
yarn katla:new it-bestallning --name "IT-beställning" --schema it-bestallning-arendeuppgifter
yarn katla:check it-bestallning
```

Följ [introduktionsguiden](adding-a-katla.md) för anslutning, lokal start, verifiering och bygge. Exemplet ovan är ett kommando för nästa Katla; det skapar ingen ansluten verksamhet automatiskt.

Mina Katlor kör som en separat kataloginstans. Den visar bara publicerade appar som den inloggade användarens verifierade grupper ger tillgång till. Samma serverpolicy styr direktåtkomst till apparna. En backendimage återanvänds per release; frontend byggs per Katla/katalog och målmiljö. Se [driftguiden](katla-operations.md).

## Rekommenderad granskningsordning

| Del | Börja här | Vad blev tydligare? |
| --- | --- | --- |
| Definition och ny Katla | [Definitionskontrakt](../katlor/src/definition.ts), [register](../katlor/src/index.ts), [CLI](../scripts/katla.mjs) | Produktval och standardvärden har en ägare. Appkopior behövs inte. |
| Gemensam formulärhantering | [Sparning](../frontend/src/contexts/errand-submission-provider.tsx), [formulärmedlemskap](../frontend/src/flows/errand-forms.ts), [validering](../frontend/src/flows/validate-errand.ts) | Desktop och mobil delar slutkontroll, sparning, feedback och navigering. Pågående sparning överlever byte av presentation. |
| Avvikelsens verksamhetsregler | [Delade regler](../katlor/src/avvikelse-rules.ts), [flödets komponenter](../frontend/src/flows/avvikelse) | Rapporttyp, plats och parter är avgränsade. Standardflödet kräver inga avvikelseuppgifter. |
| Åtkomst och ärendegräns | [Katalogpolicy](../backend/src/config/catalogue-policy.ts), [sessionkontroll](../backend/src/services/authorization.service.ts), [ärendetillgång](../backend/src/services/errand-access.service.ts), [skrivkontrakt](../backend/src/services/errand-submission.service.ts) | Appåtkomst, rapportörens ärendetillgång och tillåtna skrivningar kontrolleras var för sig på servern. |
| Bygg- och driftsmodell | [Frontendimage](../frontend/Dockerfile), [backendimage](../backend/Dockerfile), [fristående kontroll](../scripts/standalone.mjs), [CI](../.github/workflows/ci.yml) | En låsfil och två Dockerfiler äger byggvägen. Paketen provas utanför källrepot. |

Separata inskickningsvägar, utspridda kopior av avvikelseregler, lokala schemaoverrides och den gemensamma genererade proxy-miljöfilen är borttagna. JSON Schema-tjänsten äger produktionsscheman; Astryx och det befintliga temat äger designen.

## Avsiktliga beteendeändringar

- Ogiltig instanskonfiguration stoppar start. Fel Katla-id eller definitionsrevision mellan frontend och backend blockerar användning med ett tydligt fel.
- Åtkomst kontrolleras vid skyddade anrop. Policyändringar får genomslag genom omläsning; gamla gruppclaims kräver ny inloggning. Katalogläge registrerar inga ärende-, schema- eller personendpoints.
- Servern avgränsar ärenden till den verifierade rapportören och kontrollerar statusövergångar, schemaidentitet, inskickade uppgifter och verksamhetsklassificering. Klientens labels är inte auktoritativa.
- Första utkastet låser samtliga formulärreferenser, även de som ännu inte öppnats i mobilen. Sparade formulär behåller sina schema-id:n och sitt medlemskap när definitionen senare ändras.
- Mobil och desktop delar samma slutvalidering. Schemafel och avvikelsens person-/platskrav kan därför inte kringgås genom presentationsbyte.
- Sessioner och lokal lagring avgränsas per instans. Direktlänkar bevaras genom inloggning.

Avvikelsedefinitionens produktval följer den tidigare exempelkonfigurationen. Driftens faktiska inställningar behöver inventeras före övergång. Ingen ärendedata har migrerats och inga historiska scheman har ändrats.

## Genomförd lokal verifiering

| Kontroll | Resultat |
| --- | --- |
| Definitions- och CLI-kontrakt | 8 + 6 tester godkända, inklusive generering, typkontroll av genererad Katla och skydd mot överskrivning. |
| Backend | 202 tester godkända. |
| Frontend | 390 tester godkända, inklusive flera formulär, historiska schema-id:n och sparning vid byte mellan desktop/mobil. |
| Statisk kvalitet | Gemensam typkontroll, strikt lint, formatkontroller, Node-/TypeScript-kontrakt och `git diff --check` godkända. |
| Avvikelse i webbläsare | 104 tester godkända mot fristående produktionsbygge. |
| Standard-Katla i webbläsare | 6 tester godkända mot produktionsbygge: giltig inskickning, obligatoriska fält och utkast/återöppning med ursprunglig schemaversion på desktop och mobil. |
| Mina Katlor i webbläsare | 7 tester godkända mot produktionsbygge med `/portal`: noll/en/flera tilldelningar, återförsök, revisionsfel, direktlänk, avgränsade rutter och tangentbord/reflow på svenska och engelska. |
| Fristående frontend | Avvikelse-test, schema-test och katalog startar utanför källrepot. Definitionsrevision och bildkodning/-avkodning med AVIF/WebP kontrollerade. |
| Fristående backend | Ren installation av produktionsberoenden och katalogstart utan ärende-API-hemligheter. Identitet, autentiseringskrav och frånvaro av verksamhetsendpoints kontrollerade. |
| Dockerimages | Gemensam backend samt Avvikelse- och katalogfrontend byggda på Linux arm64. Båda frontendcontainers startar som användare 1001, visar login och konverterar AVIF/WebP. Backendens artefaktkontroll passerar även inuti imagen. |
| RHEL 8.10 | Bygge och båda artefaktkontrollerna godkända i UBI 8.10, Linux amd64, Node 22.18.0 och Yarn 1.22.22. |

Totalt 606 enhets-/kontrakttester och 117 webbläsarscenarier. Browserproven använder kontrollerade API-/identitetsfixtures. De verifierar inte organisationens verkliga inloggning eller mottagning i Draken.

Enhets-, kontrakts-, browser- och frontendens artefaktkontroller upprepades 2026-09-08 efter integration av Astryx-branchen till `fe7469c`. Typkontroll, lint och formatkontroller är också gröna. Docker- och RHEL-proven av paketeringen genomfördes 2026-09-07; CI innehåller dessa kontroller för PR-versionen.

Monorepots selektiva beroendeval ligger i roten med workspace-anpassade sökvägar. Nexts Sharp och dess native-bibliotek kontrolleras genom faktisk bildkonvertering i det isolerade paketet. Dockerbygget kör också denna kontroll så saknade bibliotek stoppar bygget.

Lokala image-taggar är `katla-api:worktree-903e`, `katla-web:avvikelse-worktree-903e` och `katla-web:catalogue-worktree-903e`. De är granskningsbyggen av paketeringen från 2026-09-07 med lokala adresser, inte releaser för drift.

## Rättningar efter PR- och Sonar-granskning 2026-09-08

Sonar-analysen av `8a81f00` markerade samtliga 38 tidigare öppna fynd som `CLOSED / FIXED`. Quality Gate är godkänd med 0 öppna fynd och 0 säkerhetshotspots. Inga fynd accepterades eller undantogs. Aktuell CI-status för den senaste revisionen finns i PR #102; Sonars Quality Gate och GitHubs importerade säkerhetslarm är separata kontroller.

- Backendartefaktens plats ägs av paketeringsskriptet och delas med startkontrollen. Fria sökvägsargument är borttagna; befintliga kataloger skrivs aldrig över. Två nya beteendetester skyddar mot sökvägs-/programargument och överskrivning via katalog eller symlänk.
- Katla-kommandon startar Yarn genom dess explicita programfil. Loggen från anslutningskontrollen innehåller inte längre API-data.
- Ärendeskrivningen skiljer nu mellan formulärmedlemskap, schemavärden och verksamhetsklassificering. Befintliga gränstester skyddar samma felkoder och livscykel. Frontendens gemensamma sparningskontrakt har stabila callbacks.
- Linux-testernas klippta utloggningsrubrik vid 200 procent text åtgärdas med radbrytning inom rubrikens tillgängliga bredd. Reflow-testernas assertions är oförändrade.
- PR-beskrivningen innehåller Mermaid-diagram över definitioner och delad kod, images och namespaces samt SAML och åtkomstkontroll.

De lokala enhets-/kontraktssviterna omfattar nu 608 tester (8 definitioner, 8 verktyg, 202 backend, 390 frontend). Den isolerade backendkontrollen startar utan ärende-API-hemligheter efter en ren produktionsinstallation. Som tidigare behövs verklig extern acceptans före lansering.

## Återstående acceptans och återställning

Före lansering behöver en riktig testmiljö verifiera SAML/SSO och gruppändringar, mottagningen i Draken, SupportManagements rapportörsfilter och versionskontroll samt verkliga historiska utkast. En annan utvecklare ska också följa guiden från ren klon. Först det försöket ger underlag för hur snabbt en verksamhets-Katla kan införas.

Granska kodändringarna enligt tabellen ovan. Aktivera därefter ett matchande frontend-/backendpar med verifierad konfiguration och policy. Återställning använder föregående kompletta par och bevarar historiska scheman. Den fullständiga arbetsgången och externa acceptansen finns i [driftguiden](katla-operations.md).
