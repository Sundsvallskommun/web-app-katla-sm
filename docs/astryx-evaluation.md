# Astryx i Katla – implementation och förvaltningsbeslut

Katla använder Astryx **0.5.2** från npm. Komponentkällkod har inte kopierats in och inget kompatibilitetslager som efterliknar SK:s API finns kvar. Quill äger fortfarande redigeringen; appen behåller ärendedata, JSON-scheman, API-kontrakt, validering och verksamhetsregler.

Arbetet finns på `feature/astryx-ui` i [draft PR #101](https://github.com/Sundsvallskommun/web-app-katla-sm/pull/101), med `main` som bas. De fristående WCAG-ändringarna har redan mergats i [PR #100](https://github.com/Sundsvallskommun/web-app-katla-sm/pull/100). Astryx behövs alltså inte för att ta in dem. Mains formulärändringar den 7 september ingår genom en separat merge.

Worktree: `/Users/maxeriksson/Desktop/Repo/web-app-katla-sm-worktrees/astryx-modern-ui`. Originalprojektets lokala main och parallella ändringar har inte ändrats i detta arbete.

## Design och ägarskap

| Del | Slutlig ägare och beslut |
| --- | --- |
| Appskal | En gemensam `AppHeader` med Astryx `TopNav`, inuti `AppShell`. Samma kontrollordning på mobil och desktop. Biblioteket äger huvudlandmärke och hoppa-till-innehåll-länk. Headern mäter cirka 54px i CI-bilderna; testgränsen är 72px på båda bredderna. |
| Översikt | Statusfilter är synliga ovanför samlingen. Separata mobilheaders, helskärmsmeny, sidebar och viewport-context är borttagna. `useOverviewErrands` äger hämtningen för båda presentationerna och totalen kommer från samma listsvar. Sidomenyns separata räkneanrop och count-store är borttagna. |
| Rapporter | Kompakta `ListItem`-rader på mobil, semantisk `Table` på desktop. En riktig länk per rapport. Desktop behåller sortering, sidstorlek, radhöjd och paginering; mobil behåller läs in fler. |
| Ärende och registrering | Ärendenummer och status finns vid sidrubriken. `TabList` äger länkar mellan innehållsvyer. Mobilguiden använder `Layout` med fast åtgärdsfot och skrollbart innehåll; nästa steg får rubrikfokus. |
| Meddelanden | Konversation före redigerare, med genväg till skrivfältet. Formatering öppnas vid behov med `Collapsible`. Uppdatering och formateringsmeny behåller oskickad text. Filbilagor och sändningslås finns kvar. |
| Laddning | Vyspecifika `Skeleton` för rapportlista, tabell, ärende och meddelanden. Dekorationerna döljs från hjälpmedel; omgivande region beskriver laddning. Fel ersätter inte riktiga data med ett falskt tomt tillstånd. Uppdatering/läs in fler behåller redan hämtat innehåll. |
| Tema | `src/theme/katla.ts` utökar Astryx neutral med teal accent, låg kromatik i neutrala ytor, systemtypsnitt och bibliotekets starkare kontrastskala. Den sistnämnda rättar filterkontrasten i mörkt läge och stärker formulärgränser. Status är `Token`, antal är `Badge`. |
| Routing och utilities | `AppLayout` äger `LinkProvider` med Next.js Link. Egen `LinkButton` och viewport-hook är borttagna. `useClickableContainer` samlar tabellradens klick runt den riktiga länken. [Utilities-granskningen](astryx-utilities.md) redovisar hela listan och varför vissa helpers inte behövs. |
| Språk och överlägg | `LocalizationProvider` kopplar samma route-locale till i18next och Astryx `InternationalizationProvider`, med bibliotekets svenska katalog. En `LayerProvider` äger toastkonfiguration. Dialogerna använder Astryx fokus- och modalitetsbeteenden. |

[UX-besluten](astryx-mobile-ux.md) beskriver avvägningar, laddning, layout och återgång. [Bildgalleriet](astryx-preview.html) visar verkliga Chromium-bilder med testdata, utan att backend eller SSO behöver startas.

## Vad appen fortsatt behöver äga

RJSF:s externa fält-id:n, formulärvärden och felkopplingar är ett integrationskontrakt. Där kompletta bibliotekskontroller äger egna id:n används deras kopplingar; där externa id:n krävs används Astryx `Field`-primitiver. `focus-first-error` navigerar från valideringsfel till rätt fält. Detta ska inte ersättas med en andra generell input-wrapper.

`RichTextEditor` äger en Quill-instans, HTML/ren text, formatering, Tab-beteende och cleanup. Sanitering ligger kvar vid HTML-gränsen. `MessageComposer` äger webbläsarens `File`-objekt; conversation-servicen äger befintligt multipart-format. Ett misslyckat sändningsförsök bevarar innehållet.

Route-identitet förhindrar att ett sent svar från ärende A visas eller sparas som B. Språkbyte överlämnar aktuella formulärvärden och mobilsteg. Sparning, readonly och villkorliga steg fortsätter använda befintliga ägare. Cookie-nyckeln `SKCookieConsent` är kvar för tidigare samtycken; det är ingen kvarvarande biblioteksdependency.

Inaktivitetsövervakningen behåller separata timerfaser för varning och utloggning. Aktivitet före varningen skjuter upp den; efter varningen krävs ett uttryckligt val att stanna inloggad. Dialogtester skyddar initialt fokus, Escape, inert bakgrund, återställt fokus och personformulärets nollställning per öppning.

## Mindre specialkod

SK-paket, Sass, parallell temabrygga, toastpatch och `patch-package` är borttagna. CI, RHEL-bygge och Docker använder inte längre det borttagna postinstall-steget. Beroendeskript förblir avstängda i dessa installationer.

Handskriven CSS/SCSS under `frontend/src/`, exklusive genererat tema, är **168 rader**, jämfört med 717 vid `0cfb2c2`. Resterande CSS gäller framför allt RJSF, Quills genererade DOM, fokusring/reducerad rörelse och skärmens safe area. Ingen ny CSS-fil har lagts till för UX-omtaget. Strukturella innehållsbredder är appbeslut; intern spacing kommer från komponentprops och tokens.

Temafilerna i `src/theme/generated/` ska genereras, inte handredigeras:

```sh
cd frontend
yarn theme:build
yarn theme:check
```

Komponentbiblioteket är låst till 0.5.2. En uppgradering kräver regenererat tema och kontroll av våra integrationskontrakt. Bibliotekets egna tester bevisar inte att Katlas formulär, routing och överlägg fungerar tillsammans.

## Verifiering

Kod och bilder verifierade på `6069632caa56eea677586c9cafe9fa4aa354042d`, den 7 september 2026:

| Kontroll | Resultat |
| --- | --- |
| [Frontend CI](https://github.com/Sundsvallskommun/web-app-katla-sm/actions/runs/34133142842) | Lint, format, typkontroll och 323 enhetstester godkända. |
| Chromium mot standalone-paketet | 94/94 scenarier godkända, inga omkörningar, cirka 2,1 minuter. |
| Axe | 16 scanningar, inga rapporterade regelbrott eller JavaScript-fel. |
| Backend CI | Lint, format, typkontroll och 167 tester godkända; 4 befintliga tester överhoppade. |
| [RHEL 8.10](https://github.com/Sundsvallskommun/web-app-katla-sm/actions/runs/34133142844) | Frontend- och backend-byggen samt standalone-bildbehandling godkända. |

Bildgalleriets 16 vy-/temabilder och fem kompletterande laddnings-/mobilbilder kommer från samma kodcommit och CI-körning. `incomplete` omfattar `aria-valid-attr-value` i 16 scanningar och `color-contrast` i 6; de räknas inte som godkända kontroller. Det gäller bland annat stängda popup-kontrollers referenser och kontrast som motorn inte kunde avgöra. Se fullständiga noder i audit-filen.

 Lokal validering denna omgång omfattar enbart Astryx CLI, formatering, lint och minnesbegränsad typkontroll för app, unit och E2E. Inga lokala appservrar, byggjobb eller fulla testsuiter har startats efter minnesincidenten.

CI bygger med Webpack och kör Chromium mot det färdiga standalone-paketet med en Playwright-worker. API-fixtures används; testerna skickar inga riktiga rapporter eller meddelanden. Bland kontrakten finns:

- Svenska/engelska vid 320px, mobil/desktop-byte och nåbara kontroller vid 800/1024px.
- Skeleton före svar, inga falska rapporter i laddning, och öppen meny som överlever färdigladdat ärende.
- Klientnavigation, en länk per rad, markering av text utan oavsiktlig navigation och synliga filter.
- Payload, schema-id:n, validering/felfokus, språkbyte och skydd mot sena ärendesvar.
- Rich text, bilagor, teckengräns, uppdatering och oskickat innehåll.
- Registreringsguidens åtgärder och rubrikfokus vid 390×568px.
- Axe på fyra vyer i ljust/mörkt vid 390/1536px. `incomplete` redovisas separat i [audit.json](astryx-screenshots/audit.json).

Automatiska kontroller är inte ett intyg om WCAG-överensstämmelse. Verklig SSO, skärmläsarflöden, fysisk mjukvarutangentbordshantering på iOS/Android och övriga webbläsare återstår före release. Testet med låg skärmhöjd verifierar reflow, inte en verklig telefontangentbordssession.

## Drift, risk och återgång

Webpack är standard för dev, build, testbygge och analys. Valet undviker den misstänkta Turbopack-vägen; det fastställer inte grundorsaken till den tidigare minnesincidenten. Den 6 september registrerade macOS 2 545 Node-processer i Codex processgrupp, med cirka 101 GiB sammanlagt rapporterat fotavtryck. Rapporten saknar fullständiga kommandoargument. Det är inte fastställt som en minnesläcka i Katlas webbläsarkod, och grundorsaken behöver fortsatt undersökas i en isolerad miljö med process- och minnesgränser.

Draften kräver fortfarande teamets design- och biblioteksbeslut. Ingen merge, driftsättning eller datamigrering har gjorts. Migrations-, UX- och utilities-commits går att granska var för sig. Återgång till nuvarande main behåller de redan mergade WCAG-rättningarna. Använd en granskad revert efter en eventuell framtida merge; återställ inte användarens parallella arbetskopia.

Starta själv från worktreens `frontend/` med `PORT=3107 yarn dev`. Verklig appanvändning kräver som tidigare lokal miljökonfiguration och backend/SSO.
