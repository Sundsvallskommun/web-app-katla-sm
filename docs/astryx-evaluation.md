# Astryx i Katla – implementation och förvaltningsbeslut

Katla använder Astryx **0.5.2** från npm. Komponentkällkod har inte kopierats in och inget kompatibilitetslager som efterliknar SK:s API finns kvar. Quill äger fortfarande redigeringen; appen behåller ärendedata, JSON-scheman, API-kontrakt, validering och verksamhetsregler.

Arbetet finns på `feature/astryx-ui` i [draft PR #101](https://github.com/Sundsvallskommun/web-app-katla-sm/pull/101), med `main` som bas. De fristående WCAG-ändringarna har redan mergats i [PR #100](https://github.com/Sundsvallskommun/web-app-katla-sm/pull/100). Astryx behövs alltså inte för att ta in dem. Mains formulärändringar den 7 september ingår genom en separat merge.

Utvecklingen görs i isolerade git-worktrees för att hålla rättningarna åtskilda från parallellt lokalt arbete.

## Design och ägarskap

| Del | Slutlig ägare och beslut |
| --- | --- |
| Appskal | En gemensam `AppHeader` med Astryx `TopNav`, inuti `AppShell`. Samma kontrollordning på mobil och desktop. Biblioteket äger huvudlandmärke och hoppa-till-innehåll-länk. Headern mäter cirka 54px i CI-bilderna; testgränsen är 72px på båda bredderna. |
| Översikt | Statusfilter är synliga ovanför samlingen. Separata mobilheaders, helskärmsmeny, sidebar och viewport-context är borttagna. `useOverviewErrands` äger hämtningen för båda presentationerna och totalen kommer från samma listsvar. Sidomenyns separata räkneanrop och count-store är borttagna. |
| Rapporter | Kompakta `ListItem`-rader på mobil, semantisk `Table` på desktop. En riktig länk per rapport. Desktop behåller sortering, sidstorlek, radhöjd och paginering; mobil behåller läs in fler. |
| Ärende och registrering | Ärendenummer och status finns vid sidrubriken. `TabList` äger länkar mellan innehållsvyer. Registrering och utkast använder `LayoutFooter` utanför det skrollbara formuläret även på desktop. Åtgärdsraden tar egen plats och täcker inte sista fältet. Knappgrupperna äger radens kompakta padding; safe-area-regeln lägger bara till enhetens faktiska skyddszon, utan extra bottenmarginal på desktop. I CI-bilderna är raden 49px på desktop (tidigare 89px) och 53px på mobil (tidigare 85px), vid en knapprad utan extra safe area. Knapparnas storlek är oförändrad. Mobilguiden använder samma layoutmodell; nästa steg får rubrikfokus. |
| Personer | `StakeholderRow` ersätter nästlade personkort med Astryx `ListItem`. Namn och kontaktuppgifter hålls ihop, borttagning och manuellt tillägg använder synliga sekundärknappar. Sökfältets bredd är stabil under inmatning; efter träff finns en textmärkt återställning. |
| Notifieringar | Astryx `Dialog` och `Layout` skiljer fast rubrik/stängknapp från skrollande `ListItem`-rader. Beskrivning, ärendelänk, avsändare och tid visas kompakt utan separat upprepad händelserad. Befintlig sortering, kvittering och felhantering behålls. |
| Meddelanden | Konversation före redigerare, med genväg till skrivfältet. Formatering öppnas vid behov med `Collapsible`. Uppdatering och formateringsmeny behåller oskickad text. Filbilagor och sändningslås finns kvar. |
| Laddning | Vyspecifika `Skeleton` för rapportlista, tabell, ärende, meddelanden och notifieringar. Dekorationerna döljs från hjälpmedel; omgivande region beskriver laddning. Fel ersätter inte riktiga data med ett falskt tomt tillstånd. Uppdatering/läs in fler behåller redan hämtat innehåll. |
| Tema | `src/theme/katla.ts` utökar Astryx neutral med teal accent, låg kromatik i neutrala ytor, systemtypsnitt och bibliotekets starkare kontrastskala. Den sistnämnda rättar filterkontrasten i mörkt läge och stärker formulärgränser. Ärendestatus och personroller använder `Token`; räknare använder `Badge`. |
| Routing och utilities | `AppLayout` äger `LinkProvider` med Next.js Link. Egen `LinkButton` och viewport-hook är borttagna. `useClickableContainer` samlar tabellradens klick runt den riktiga länken. [Utilities-granskningen](astryx-utilities.md) redovisar hela listan och varför vissa helpers inte behövs. |
| Språk och överlägg | `LocalizationProvider` kopplar samma route-locale till i18next och Astryx `InternationalizationProvider`, med bibliotekets svenska katalog. En `LayerProvider` äger toastkonfiguration. Dialogerna använder Astryx fokus- och modalitetsbeteenden. |

[UX-besluten](astryx-mobile-ux.md) beskriver avvägningar, laddning, layout och återgång. [Bildgalleriet](astryx-preview.html) visar verkliga Chromium-bilder med testdata, utan att backend eller SSO behöver startas.

## Vad appen fortsatt behöver äga

RJSF:s externa fält-id:n, formulärvärden och felkopplingar är ett integrationskontrakt. Där kompletta bibliotekskontroller äger egna id:n används deras kopplingar; där externa id:n krävs används Astryx `Field`-primitiver. `focus-first-error` navigerar från valideringsfel till rätt fält. Detta ska inte ersättas med en andra generell input-wrapper. Native datum- och tidsfält använder blocklayout så att webbläsaren placerar indikatorn vid fältets slut. Appens fallback för fokus ligger i reset-lagret: Astryx får själv undertrycka det inre fältets outline och markera sin rundade behållare.

`RichTextEditor` äger en Quill-instans, HTML/ren text, formatering, Tab-beteende och cleanup. Sanitering ligger kvar vid HTML-gränsen. `MessageComposer` äger webbläsarens `File`-objekt; conversation-servicen äger befintligt multipart-format. Ett misslyckat sändningsförsök bevarar innehållet.

Route-identitet förhindrar att ett sent svar från ärende A visas eller sparas som B. Språkbyte överlämnar aktuella formulärvärden och mobilsteg. Sparning, readonly och villkorliga steg fortsätter använda befintliga ägare. Cookie-nyckeln `SKCookieConsent` är kvar för tidigare samtycken; det är ingen kvarvarande biblioteksdependency.

Inaktivitetsövervakningen behåller separata timerfaser för varning och utloggning. Aktivitet före varningen skjuter upp den; efter varningen krävs ett uttryckligt val att stanna inloggad. Dialogtester skyddar initialt fokus, Escape, inert bakgrund, återställt fokus och personformulärets nollställning per öppning.

## Mindre specialkod

SK-paket, Sass, parallell temabrygga, toastpatch och `patch-package` är borttagna. CI, RHEL-bygge och Docker använder inte längre det borttagna postinstall-steget. Beroendeskript förblir avstängda i dessa installationer.

Handskriven CSS/SCSS under `frontend/src/`, exklusive genererat tema, är **174 rader**, jämfört med 717 vid `0cfb2c2`. Resterande CSS gäller framför allt RJSF, Quills genererade DOM, fokusring/reducerad rörelse och skärmens safe area. Ingen ny CSS-fil har lagts till för UX-omtaget. Strukturella innehållsbredder är appbeslut; intern spacing kommer från komponentprops och tokens.

Temafilerna i `src/theme/generated/` ska genereras, inte handredigeras:

```sh
cd frontend
yarn theme:build
yarn theme:check
```

Komponentbiblioteket är låst till 0.5.2. En uppgradering kräver regenererat tema och kontroll av våra integrationskontrakt. Bibliotekets egna tester bevisar inte att Katlas formulär, routing och överlägg fungerar tillsammans.

## Verifiering

Kod och bilder verifierade på `90fca2e397813ee5b8d299793086a8647120fa78`, den 7 september 2026:

| Kontroll | Resultat |
| --- | --- |
| [Frontend CI](https://github.com/Sundsvallskommun/web-app-katla-sm/actions/runs/34143143177) | Lint, format, typkontroll och 323 enhetstester godkända. |
| Chromium mot standalone-paketet | 99/99 scenarier godkända, inga omkörningar, cirka 1,7 minuter. |
| Axe | 16 scanningar, inga rapporterade regelbrott eller JavaScript-fel. |
| Backend CI | Lint, format, typkontroll och 167 tester godkända; 4 befintliga tester överhoppade. |
| [RHEL 8.10](https://github.com/Sundsvallskommun/web-app-katla-sm/actions/runs/34143143045) | Frontend- och backend-byggen samt standalone-bildbehandling godkända. |

Bildgalleriets 32 bilder av vyer, teman, laddning, formulär och notifieringar kommer från samma kodcommit och CI-körning. `incomplete` omfattar `aria-valid-attr-value` i 16 scanningar och `color-contrast` i 6; de räknas inte som godkända kontroller. Det gäller bland annat stängda popup-kontrollers referenser och kontrast som motorn inte kunde avgöra. Se fullständiga noder i audit-filen.

Lokal validering denna omgång omfattar enbart Astryx CLI, formatering, lint och minnesbegränsad typkontroll för app, unit och E2E. Inga lokala appservrar, byggjobb eller fulla testsuiter har startats efter minnesincidenten.

CI bygger med Webpack och kör Chromium mot det färdiga standalone-paketet med en Playwright-worker. API-fixtures används; testerna skickar inga riktiga rapporter eller meddelanden. Bland kontrakten finns:

- Svenska/engelska vid 320px, mobil/desktop-byte och nåbara kontroller vid 800/1024px.
- Skeleton före svar, inga falska rapporter i laddning, och öppen meny som överlever färdigladdat ärende.
- Klientnavigation, en länk per rad, markering av text utan oavsiktlig navigation och synliga filter.
- Payload, schema-id:n, validering/felfokus, språkbyte och skydd mot sena ärendesvar.
- Rich text, bilagor, teckengräns, uppdatering och oskickat innehåll.
- Registreringsguidens åtgärder och rubrikfokus vid 390×568px.
- Stabil sökfältsbredd under inmatning, manuell person med sammanhållna kontaktuppgifter och synliga tilläggs-/borttagningsknappar.
- Datum-/tidsindikatorer vid fältets slut, en rundad fokusmarkering och hela textfältet synligt ovanför åtgärdsraden vid riktig Tab-navigation.
- Notifieringshistorik med fast rubrik/stängknapp och en fokusring per rad vid 390/1536px; Escape och återställt fokus.
- Axe på fyra vyer i ljust/mörkt vid 390/1536px. `incomplete` redovisas separat i [audit.json](astryx-screenshots/audit.json).

Automatiska kontroller är inte ett intyg om WCAG-överensstämmelse. Verklig SSO, skärmläsarflöden, fysisk mjukvarutangentbordshantering på iOS/Android och övriga webbläsare återstår före release. Testet med låg skärmhöjd verifierar reflow, inte en verklig telefontangentbordssession.

## Drift, risk och återgång

Webpack är standard för dev, build, testbygge och analys. Valet undviker den misstänkta Turbopack-vägen; det fastställer inte grundorsaken till den tidigare minnesincidenten. Den 6 september registrerade macOS 2 545 Node-processer i Codex processgrupp, med cirka 101 GiB sammanlagt rapporterat fotavtryck. Rapporten saknar fullständiga kommandoargument. Det är inte fastställt som en minnesläcka i Katlas webbläsarkod, och grundorsaken behöver fortsatt undersökas i en isolerad miljö med process- och minnesgränser.

Draften kräver fortfarande teamets design- och biblioteksbeslut. Ingen merge, driftsättning eller datamigrering har gjorts. Migrations-, UX- och utilities-commits går att granska var för sig. Återgång till nuvarande main behåller de redan mergade WCAG-rättningarna. Använd en granskad revert efter en eventuell framtida merge; återställ inte användarens parallella arbetskopia.

Starta själv från worktreens `frontend/` med `PORT=3107 yarn dev`. Verklig appanvändning kräver som tidigare lokal miljökonfiguration och backend/SSO.
