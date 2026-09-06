# Astryx i Katla – genomförd migrering

## Omfattning och jämförelse

Katlas gränssnitt använder nu Astryx 0.5.2 som gemensamt komponentbibliotek. SK-paketen, deras importer och den parallella temabryggan är borttagna. Astryx egna komponentmått, ytor och tillstånd styr presentationen. Applikationen behåller ansvar för ärendedata, JSON-scheman, API-kontrakt, verksamhetsregler och feature flags.

Migreringen finns på `feature/astryx-ui` och lämnas som draft ovanpå `fix/wcag-accessibility` ([PR #100](https://github.com/Sundsvallskommun/web-app-katla-sm/pull/100)). WCAG-branchen bygger på aktuell main vid `ff78303` och behåller SK och paketversionerna. Den kan mergas utan Astryx. Migreringens diff mot WCAG-basen innehåller själva biblioteksbytet och dess anpassningar; efter att WCAG har mergats kan draftens bas flyttas till main.

Worktreen är `/Users/maxeriksson/Desktop/Repo/web-app-katla-sm-worktrees/astryx-modern-ui`. Originalprojektets lokala main och parallella arbete ändras inte i denna uppdelning. De tidigare försökscommitsen finns kvar på `feature/astryx-modern-ui`; den senare WCAG-ögonblicksbilden finns på `backup/pre-astryx-main-20260906`.

Komponenter importeras direkt från npm-paketen `@astryxdesign/core` och `@astryxdesign/theme-neutral`. Ingen biblioteksimplementation har kopierats in genom `swizzle`, och inget generellt lager som efterliknar SK:s API har införts. Quill 2.0.3 är en direkt dependency för redigeringsmotorn.

## Kanoniska ägare

| Ansvar                | Ägare och avgränsning                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tema                  | [katla.ts](../frontend/src/theme/katla.ts) utökar Astryx neutral med Katlas accentfärg och lokala systemtypsnitt. Neutraltemat äger komponentmått, kontrastskalor och tillstånd.                                                                                                                                                                                                |
| Färgläge och språk    | [AppLayout](../frontend/src/layouts/app/app-layout.component.tsx) kopplar det befintliga färglägesvalet till Astryx `Theme`. [LocalizationProvider](../frontend/src/components/localization-provider/localization-provider.tsx) äger appens översättningar, Astryx `InternationalizationProvider` och `LayerProvider`, inklusive svenska bibliotekstexter och toastmeddelanden. |
| Skal och navigation   | `OverviewLayoutSwitcher` komponerar `AppShell`, `AppHeader`/`TopNav` och `OverviewSidebar`/`SideNav`. Ärendelayouten äger aktuell route och väljer Astryx `TabList`-länkar. `LinkButton` kopplar Astryx `Button` till en riktig Next.js-länk.                                                                                                                                   |
| Ärenden och översikt  | Befintliga services, hooks och stores äger hämtning, statusfilter, sortering, paginering, aktivt ärende och sparning. Astryx tabell-, meny-, kort- och kontrollkomponenter presenterar dessa tillstånd. Mobilens separata listflöde består.                                                                                                                                     |
| Schemaformulär        | RJSF, schemaadaptrarna och `FormValidationProvider` äger värden, schema-id:n och validering. Field templates och widgets kopplar detta till Astryx kontroller eller små nativa fält med Astryx `Field`-primitiver. `focus-first-error` äger navigering från fel till fält.                                                                                                      |
| Rich text och bilagor | [RichTextEditor](../frontend/src/components/rich-text-editor/rich-text-editor.component.tsx) äger Quill-instansen, livscykel, formatering och tillgänglighetskopplingar. Verktygsraden och länkdialogen använder Astryx. Meddelandekompositören äger valda webbläsar-`File`-objekt; conversation-servicen äger samma multipart-format som tidigare.                             |
| Modalitet och session | Astryx `Dialog` och `useFocusTrap` äger modalitet och fokus. Respektive appkomponent äger öppet/stängt tillstånd och åtgärder. `InactivityMonitor` äger separata timerfaser för inaktivitet och utloggningsvarning. Cookiekomponenten äger samtyckesval och befintlig lagring.                                                                                                  |

Filerna i `frontend/src/theme/generated/` genereras från temakällan och ska inte handredigeras. Kör från `frontend/`:

```sh
yarn theme:build
yarn theme:check
```

En profiländring görs i temakällan och genereras därifrån. Den behöver inte spridas till knappar, sidhuvuden eller en parallell tokenkarta.

## Bevarade beteendekontrakt

Formulären behåller sina värden, JSON-payloads, villkorliga steg, required/readonly/disabled-tillstånd och felåterhämtning. Byte av språk använder fortfarande formuläröverlämningen så att rapporten och aktuellt mobilsteg kan överleva navigeringen. Route-identitet skyddar mot att ett tidigare ärendes data visas eller sparas för ett nytt ärende.

RJSF:s externa fält-id:n är ett uttryckligt integrationskrav. Astryx fullständiga fältkomponenter kan äga egna id:n, etiketter och ARIA-relationer. Där det externa id:t behövs direkt används en nativ kontroll med publicerade `Field`-stilar, bland annat för datumfält. Sökbara val använder Astryx `Selector`/`MultiSelector` och bibliotekets interna etikett-/felkopplingar. Ett omgivande `data-invalid-field` förankrar dem i formulärets felnavigering. Label, hjälptext och fel ska ha en tydlig ägare; dubbla etiketter eller osammanhängande id-kopplingar ska inte läggas till för att efterlikna den tidigare komponenten.

Rich text behåller kontraktet med HTML och ren text, medan Quill initieras och städas upp av en enda komponent. Tab lämnar redigeringsfältet även inne i en lista. Formatering, länkar, valideringsstatus och översatta kontroller ligger i samma ägare. Bilagor skickas fortfarande i `attachments` och meddelandet som JSON i `message`; det lokala SK-omslaget `UploadFile` har ersatts med webbläsarens `File`.

Riktiga länkar används för navigation. Modala menyer, notifieringar och bekräftelser har fokusbegränsning och fokusåterställning; Escape stänger de dialoger där avbrytande är tillåtet. Samtyckesdialogen stängs genom ett uttryckligt val. Cookie-namnet `SKCookieConsent` och dess lagrade kategorier bevaras för att tidigare samtycke ska fortsätta fungera. Namnet är en lagringsnyckel, inte ett kvarvarande bibliotek.

Inaktivitetsvarningen har också fått en avgränsad beteendekorrigering: tidigare kunde effektstädningen radera utloggningstimern när varningen öppnades. Varje fas äger nu sin timer. Aktivitet skjuter upp den första varningen; när den visas krävs ett uttryckligt val att stanna inloggad för att avbryta nedräkningen. Regressionstester täcker varning, omstart, Escape, manuell utloggning och utloggning när tiden går ut.

## WCAG-stacken och ytterligare rättningar

Alla senare WCAG-rättningar har jämförts mot migreringen. Biblioteksoberoende ändringar som viewport-livscykel och uppladdningens låsning återanvänds. SK-specifik CSS och `ModalLayer` ersätts av Astryx komponenter och native dialoger. Konformitetsrapportens historiska F1–F6 beskriver SK-baslinjen; detta dokument beskriver motsvarande integrationsägare i Astryx.

- Dialogerna bevarar inert bakgrund, säkert initialt fokus, Escape, fokusåterställning och uttryckligt avbrytande. Personformuläret monteras per öppning så att kasserade utkast inte ligger kvar. Dess layout-cleanup stänger dialogen och återställer utlösaren före avmontering; fälten kan skrollas inom dialogen på 320px.
- Bekräftelser använder `purpose="form"` och säker avbrytknapp som autofokus, vilket också hindrar oavsiktlig stängning genom klick på bakgrunden.
- Meddelanden behåller senaste mains uppdatering och sidvis hämtning, även efter sidor med enbart systemmeddelanden. Den riktiga Quill-editorn och bilagorna låses under sändning; misslyckad sändning bevarar innehållet.
- Headerns dubbla vertikala padding är borttagen. Astryx TopNav äger radens grundmått; kontrollerna behåller bibliotekets storlek. Uppmätt ärendeheader är 61px på desktop och 109px på mobil, på både svenska och engelska. Tester sätter höjdtak på 72px på desktop och 128px på mobil och skyddar nåbara kontroller, svenska/engelska samt långt användarnamn vid 800px. Översikten har ett enda banner-landmärke.

## Borttagna lager och kvarvarande CSS

Direkta beroenden på `@sk-web-gui/react`, `@sk-web-gui/core`, `@sk-web-gui/alert`, `@sk-web-gui/text-editor` samt Sass är borttagna. `GuiProvider`, SK:s Tailwind-preset, `useSnackbar`, SK-färglägestyper och hjälpfunktioner används inte längre. Astryx `useToast`, strängvärden för färgläge och `clsx` ersätter de relevanta anropen.

Den tidigare temabryggan och komponentanpassningarna som efterliknade SK har raderats. Följande CSS-ägare har försvunnit: `app-base.scss`, `app-components.scss`, `app-utilities.scss`, `layouts/default-layout.scss`, `errand-table.module.css`, `overview-sidebar.module.css` och `object-field-template.module.css`. Oanvända `DefaultLayout`, `CenterDiv`, `LeadButtons`, `CardElevated` och `FilteringLayout` har tagits bort. `PageHeader` och `MobileOverlayPage` togs bort redan under första integrationssteget.

Rotens normala textstorlek är återställd till 100 procent, normalt 16px. Tailwind 3 använder sin ordinarie skala för layout, och appens avstånd har anpassats från den tidigare 10px-roten. Färgutilities läser Astryx semantiska token. CSS-lagren är:

```text
reset → app-utilities → astryx-base → astryx-theme → katla
```

`app-utilities` ligger före bibliotekets komponentlager, så utility-regler skriver inte över Astryx egna komponentmått. Astryx äger reset; Tailwinds preflight är avstängt. [katla.css](../frontend/src/styles/katla.css) innehåller grundläggande dokumentfärg, typografi, fokus och reducerad rörelse. `app-shell.module.css` hanterar skalets viewport, scroll, safe area och den befintliga kommunlogotypen. Schemafältens och Quill-redigerarens avgränsade CSS finns nära respektive integration. Handskriven CSS/SCSS under `frontend/src/`, exklusive `theme/generated`, har minskat från 717 till 206 rader jämfört med `0cfb2c2` (511 rader netto, cirka 71 procent). Detta mått omfattar de kvarvarande schema- och Quill-stilarna; genererad temakod och beroendenas CSS ingår inte.

## Validering

Verifierat 2026-09-06 på migreringen ovanpå den separata WCAG-branchen. GitHub CI kör dessutom branchens egna kontroller; lokal evidens redovisas här.

| Kontroll | Resultat |
| --- | --- |
| `yarn theme:check` | Godkänd; genererade temafiler matchar temakällan. |
| `yarn type-check` | Godkänd för app, unit och E2E. |
| `yarn lint` | Godkänd. |
| `yarn test` | 56 filer, 321 godkända tester, inga överhoppade. |
| `yarn build` | Godkänd med Next 16.2.11/Turbopack. |
| Playwright/Chromium | 87/87 godkända scenarier, utan omkörningar. |
| Axe och visuell granskning | 16 scanningar: fyra vyer × ljust/mörkt × 390/1536px, utan rapporterade regelbrott eller JavaScript-fel. Uppdaterade skärmbilder ingår; header, mobilregistrering, mobilöversikt och meddelanden har granskats visuellt. |

Den gemensamma webbläsarkörningen använder befintliga API-fixtures. Inga riktiga rapporter eller meddelanden skickas av dessa tester. Kör från `frontend/` mot worktreens server:

```sh
PORT=3107 NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn e2e --reporter=line
```

Översikten använder `AppShell` med `variant="section"` och dess ordinarie höjdläge. Därmed kan huvudinnehållet krympa utan att tabellens minimibredd gör hela sidan bredare. Ett separat webbläsartest vid 800 och 1024px kontrollerar sidnavigation, nåbara tabellänkar och frånvaro av horisontell dokument-scroll. Cookieval kontrolleras även på 320×568px.

Beteendetesterna omfattar bland annat registreringens payload, validering och felfokus, route-identitet, språkbyte utan dataförlust, sparning och bekräftelser, översiktens sortering och sidstorlek, rich text, bilagor och meddelandets teckengräns. Tillgänglighetstester granskar tangentbord, native dialogmodalitet, återställt fokus, smala skärmar och läsbarhet i båda färglägena. Kontrastmätningen komponerar Astryx enfärgade gradientlager, som används för tillstånd på knappar; varierande bilder eller överlapp behöver fortsatt bedömas visuellt.

Axe-rapportens `incomplete` redovisas separat i [audit.json](astryx-screenshots/audit.json), inte som godkända kontroller. De kvarvarande fallen gäller Astryx stängda popup-kontrollers `aria-controls`, där målpanelen ännu inte är monterad, samt kontrast som motorn inte kan avgöra för enstaka avatarinitialer, överlappande tabbetiketter och dekorativa separatorer. Schemafältens tidigare referenser till icke-renderad hjälp-/feltext är rättade vid sin ägare och täcks av ett kontraktstest som löser varje refererat id före och efter validering.

## Risk, återgång och drift

Integrationsriskerna finns främst i externa schema-id:n, sökbara kontroller, rich text-livscykeln och responsiva vyer. Dessa kontrakt ska kontrolleras vid framtida Astryx-uppgraderingar. Paketen är låsta till version 0.5.2 för denna implementation. En uppgradering omfattar regenererat tema och beteendetester, inte enbart ett versionsbyte.

Verklig SSO, fullständig skärmläsaranvändning, alla schema-/ärendevarianter och andra webbläsare än den dokumenterade Chromium-körningen är inte verifierade här. Axe-resultat med status `incomplete` behöver bedömas separat. Automatiska tester och stickprov ger inget heltäckande intyg om WCAG-överensstämmelse.

Ingen driftsättning eller datamigrering har gjorts. Worktreen gör det möjligt att fortsätta i originalprojektet utan att ta in ändringen. För teknisk återgång används WCAG-branchen utan migreringen. Efter en framtida merge återställs migreringens commit genom en granskad revert-commit. Originalkatalogen och användarens parallella ändringar ska inte återställas som del av återgången.

Appen startas med `PORT=3107 yarn dev` i worktreens `frontend/` och använder dess lokala miljökonfiguration. Interaktiv appanvändning kräver som tidigare backend/SSO. [Bildgalleriet](astryx-preview.html) visar appen med testdata och behöver inga externa tjänster. Aktuella granskningsartefakter finns under `docs/astryx-screenshots/` och avser den fullständiga migreringen i denna commit.

En lokal server för galleriet startas från worktreens rot:

```sh
python3 -m http.server 3109 --bind 127.0.0.1 --directory docs
```

Öppna därefter `http://localhost:3109/astryx-preview.html`.

## Förvaltning

Komponentpresentationen har en gemensam biblioteksägare och temat en liten appägd profil. Den dubbla providerkedjan, SK-tokenbryggan och flera CSS-ägare är borta. Domänreglerna ligger kvar hos sina tidigare ägare. De specifika integrationer som behöver appkod – RJSF:s kontrakt, Quill och lagrat samtycke – är avgränsade och har beteendetester. Slutvalideringen ovan avgör vilka delar som faktiskt har verifierats i denna arbetskopia.
