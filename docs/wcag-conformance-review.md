# WCAG 2.2 – konformitets- och gaprapport

Status: Teknisk nulägesgranskning, inte konformitetsintyg

Senast uppdaterad: 2026-09-06 (ursprunglig granskning 2026-08-12)

Mål: WCAG 2.2 nivå AA

## Sammanfattning

Katla kan inte i nuläget beskrivas som helt WCAG 2.2 AA-anpassad. Granskningen har identifierat och åtgärdat flera konkreta semantik- och tangentbordsproblem i separata kodslices, men full konformitet gäller hela sidor och kompletta processer. Den kräver därför både automatiserad kontroll och dokumenterad manuell utvärdering i realistiska användarflöden.

Samtliga sex bekräftade brister F1–F6 från granskningen den 4 september är nu åtgärdade i arbetskopian, liksom meddelandeeditorns hjälptext och teckenräknare. Kvarvarande kontrollbehov nedan är inte liktydiga med konstaterade kriteriefel. Ändringarna är inte driftsatta.

Detta dokument är den kanoniska förvaltningsrapporten för kvarvarande konformitetsarbete. Komponenternas beteende och tester ägs fortsatt av respektive komponentmodul.

## Omfattning och metod

Granskningen omfattar statisk kodanalys och beteendetester för centrala navigations-, meny-, tabell-, notifierings-, filter- och JSON Schema-formulärkomponenter. Den 4 september kompletterades den med webbläsarkontroller enligt nedan. Utöver dessa stickprov återstår:

- komplett manuell tangentbordsgenomgång av alla sidor och processer;
- skärmläsartest på representativa kombinationer av operativsystem, webbläsare och hjälpmedel;
- visuell granskning vid 200 och 400 procents zoom samt smal viewport;
- kontrastmätning för alla tillstånd och färglägen;
- användartest med personer som använder hjälpmedel;
- ett kriterium-för-kriterium-protokoll med utfall, evidens, ägare och datum.

Automatiserade tester betraktas därför som regressionsskydd, inte som ensam konformitetsevidens.

## Separat WCAG-branch, verifierad 2026-09-06

`fix/wcag-accessibility` bygger på `origin/main` vid `ff78303`, inklusive meddelanderättningar från PR #97 och säkerhetsuppdateringar från PR #98. Den här ändringen behåller SK-biblioteket och dess befintliga beroendeversioner; den kan tas in oberoende av en eventuell Astryx-migrering.

Slutkontroll i denna branch: **290 godkända enhetstester i 51 filer**, sex redan överhoppade tester, **62/62 Chromium-scenarier**, typkontroll för app/unit/E2E, lint och produktionsbygge godkända. Tester med väntande eller misslyckad meddelandesändning skyddar både låst text/bilagor och bibehållen text vid nytt försök. Inga riktiga ärenden skickas av testerna. De äldre mätresultaten nedan avser sina angivna historiska körningar.

Vid CI-omtest rättades även ett öppningsrace: viewport-hooken uppdaterar layouten före uppritning så att en öppnad notifieringspanel inte ersätts vid första mobilrenderingen. Raleways variabla font använder en giltig TrueType-deklaration och `font-display: swap`. Alla 62 browserfall passerade även med CI:s tomma basstig.

Webpack är nu uttryckligt standardval i frontendens utvecklings-, bygg-, testbygg- och analyskommandon efter den lokala minnesincidenten. Beroenden och låsfil är oförändrade; paketmanifestets skript har ändrats. Den tidigare valideringen ovan avser Turbopack. Webpack verifieras separat i GitHub CI utan nya tunga lokala körningar.

Webpack-bygget identifierade även saknade klientgränser i de tre presentationskomponenterna `EntryLayout`, `CenterDiv` och `CardElevated` på inloggningssidan. De markerar nu uttryckligen att SK-biblioteket ska laddas i klientgrafen; dess samlade exporter innehåller formulärhooks som inte kan användas som React-serverkod. Detta ändrar inte sidans funktioner eller utseende.

## Ursprunglig kontroll och åtgärder 2026-09-04

### Miljö och avgränsning

- Ursprunglig kontroll: `697b11b` plus arbetskopians editorrättning. Omtestet omfattar även F1–F6-rättningarna; ingen ny commit eller driftsättning.
- Lokal Next-devserver på `http://localhost:3000/iaf`, macOS, headless Chromium `151.0.7922.34`.
- Befintliga API-fixtures för användare, ärenden, metadata och formulär. Inga riktiga meddelanden eller rapporter skickades.
- axe-core `4.13.0`, regel-taggar `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Best-practice-regler ingår inte i siffrorna nedan.
- Svenska, 1536 × 960 och 320 × 800 CSS-pixlar för sidmatrisen; separat fokusprov vid 1440 × 900 och 390 × 844. Meddelandefältet testades även uttryckligen i mörkt läge. Svenska/engelska etiketter och räknarbeskrivningar skyddas av komponenttester.
- 320 CSS-pixlar är ett reflow-stickprov, inte ett fullständigt test med 400 % webbläsarzoom. Faktisk VoiceOver/NVDA-uppläsning har inte testats.
- I ursprungskontrollen gav Raleway-fontfilerna 404. Detta är rättat genom att låta Next behandla den befintliga font-CSS-filen och dess relativa font-URL:er; omtestet använder inläst Raleway. De historiska måtten nedan beskriver ursprungsläget, inte den rättade layouten.
- Extern SSO, produktionsdata, alla schema-/ärendevarianter, samtliga wizardsteg och kombinationer av fel, hover, fokus, textavstånd och färglägen har inte fullständigt tillgänglighetstestats. Rot- och logout-omdirigeringar ingår inte som separata axe-vyer.

### Ursprunglig sidmatris, före F1–F6-rättningarna

Siffrorna avser antal axe-regler med avvikelser i det testade tillståndet, **inte** antal fel på hela sidan eller godkännande enligt WCAG. `Incomplete` betyder att verktyget inte kunde avgöra resultatet.

| Vy under `/iaf` | Testat tillstånd | axe, desktop / mobil, ljust läge | Kompletterande resultat |
| --- | --- | --- | --- |
| `/login` | Inloggningssida, utan extern SSO | 0 / 0 | Inloggningsknappen klipps vid 320 px; se F5. |
| `/oversikt` | Mockad ärendelista | 0 / 0 | Desktop har en osäker kontrastnod. Mobil saknar `main`/`h1`; se fortsatt kontroll. Fokus bakom öppna paneler, F1. |
| `/arende/AIA-25120019/grundinformation` | Ärende med status NEW | 1 / 0 | Aktiv Rapportera-länk under kontrastkravet, F4. Två osäkra kontrastnoder i mobilhuvudet; gemensam header berörs av F6. |
| `/arende/AIA-25120019/meddelanden` | Tom konversation och editor | 1 / 0 | Samma Rapportera-länk, F4. Två osäkra kontrastnoder i mobilhuvudet; klippta headerkontroller, F6. Själva editorn har inga axe-avvikelser i dessa prover. |
| `/arende/registrera` | Initialt registreringsformulär | 0 / 0 | En osäker kontrastnod i mobilhuvudet. Separat öppnad Avbryt-dialog saknar namn, F3. |
| `/arende/inskickad` | Kvittosida | 0 / 0 | Inga ytterligare avvikelser i denna begränsade kontroll. |

Meddelandesidan kontrollerades dessutom med tom text och 10 001 tecken, i ljust/mörkt läge och båda bredderna. Inga axe-avvikelser hittades i meddelandeformuläret. Det långa textstycket gav ett osäkert kontrastresultat på grund av editorns egen skrollyta. Den öppna mobilmenyn gav inga axe-avvikelser i båda färglägena trots det manuellt verifierade fokusfelet F1.

### Bekräftade brister och genomförda rättningar

Reproduktioner och mått i F1–F6 beskriver ursprungsfelen. Åtgärd och regressionsskydd redovisas vid varje fynd.

#### F1 · P1 · Fokus hamnar bakom notifieringar och mobilmeny

Ägare: `frontend/src/components/modal-layer/modal-layer.component.tsx`, med innehåll i notifierings-, mobilmeny-, bekräftelse- och manuell-part-komponenterna.

Reproduktion: öppna notifieringar på desktop. Fokus ligger kvar på utlösaren och nästa Tab når språkknappen bakom lagret. Öppna menyn vid 390 × 844: fokus ligger kvar på Öppna meny och nästa Tab når Ny rapport bakom fullskärmsmenyn. Bakgrunden görs inte inert och fokus flyttas inte in i panelen. Escape stänger inte panelerna.

Kriterier: [2.4.3 Fokusordning](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [2.4.11 Fokus inte dolt](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html). Fullständig täckning av fokus verifierades för mobilens opaka fullskärmslager; desktop visar dessutom det felaktiga fokusflödet bakom panel/backdrop.

Uppföljningen fann samma bakomliggande fel i designsystemets Avbryt-dialog och manuell-part-dialog på både desktop och mobil: språkknappen kunde fokuseras och nästa Tab nådde ytterligare kontroller bakom dialogen. Namngivning och en fungerande Escape-funktion räckte alltså inte för att rätta deras modalitet. Samtliga aktiva anrop till designsystemets Modal/Dialog inventerades; de två skickabekräftelserna använder samma rotimplementation. `InactivityMonitor` är inte monterad och ingår inte som aktivt produktfel.

Åtgärdat: en gemensam `ModalLayer` använder native `<dialog>`/`showModal()`, med presentationerna panel och centrerad dialog. Webbläsaren äger modal bakgrund, topplager, tangentbordsnavigation och fokusåterställning; komponenten äger öppning, initialt fokus och stängning även vid avmontering. Notifieringarnas dubbla panel-/stängningsvägar har sammanförts; befintligt innehåll, designsystemets presentationskomponenter och API-beteende behålls. Installerad designsystem-Modal prövades men lämnade bakgrunden faktiskt fokuserbar vid dynamisk montering. Ingen egen Tab-lista eller manuell inert-synkronisering infördes.

Regression: `overlay-accessibility.spec.ts` provar desktop/mobil, initialt fokus, nekad programmatisk bakgrundsfokusering, Tab/Shift+Tab, stängknapp, Escape, fokusåterställning och återöppning. Native modalitet verifieras med `:modal` och beteende, inte ett förväntat `inert`-attribut. Webbläsarens eget gränssnitt får nås vid Tab-gränsen; bakomliggande sidkontroller får det inte. Saknad Escape var också en dialogmönsterbrist; inte varje utebliven Escape-funktion är i sig ett WCAG-brott.

Samma browserkontrakt skyddas för Avbryt-/Skicka-bekräftelser och manuell part i `confirmation-login-accessibility.spec.ts` respektive `stakeholder-modal-accessibility.spec.ts`. Manuell-part-formuläret behåller avmontering när det stängs och befintlig lokal validering/sparning. En avsiktlig skillnad är att klick på bakgrunden inte längre stänger den dialogen; Escape, hörnets stängknapp och Avbryt finns kvar.

#### F2 · P1 · Hoppa till innehåll är osynlig även med fokus

Ägare: `frontend/src/components/errand-layout/errand-layout-content.component.tsx`, i förhållande till sidhuvudets lager i `frontend/src/layouts/app-header.component.tsx`.

Reproduktion: fokusera ärendesidans skip-länk vid 1440 × 900. Den har position x=680, y=0, storlek 80 × 52 och `z-index:auto`; det opaka sidhuvudet ligger på lager 15. Samtliga nio provpunkter inom länken träffar sidhuvudet vid hit-testing. Enter når däremot korrekt `main#content`.

Kriterier: [2.4.7 Synligt fokus](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) och [2.4.11 Fokus inte dolt](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

Åtgärdat: skip-länken får ett synligt fokusutseende och ett lager över sidhuvudet men under modala lager. En oanvänd fokusref/timer har tagits bort; vanlig ankarnavigering når befintligt fokuserbart `main#content`. `header-accessibility.spec.ts` verifierar synlighet genom hit-testing och Enter-fokus på desktop/mobil i båda färglägena.

#### F3 · P2 · Bekräftelsedialoger saknar tillgängligt namn

Ägare: `frontend/src/components/cancel-errand-dialog.component.tsx`, `frontend/src/layouts/errand-button-group.component.tsx` och `frontend/src/components/wizard/wizard-bottom-bar.component.tsx`.

Avbryt-dialogen verifierades i webbläsaren: `role=dialog`, men `aria-labelledby` pekar på ett tomt titel-element. Den synliga rubriken Avbryt rapport finns separat och blir inte dialogens namn. Samma anrop utan namngivning finns i desktop- och wizardbekräftelsen (kodverifierat, inte separat skärmläsartestat).

Kriterium: [4.1.2 Namn, roll, värde](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).

Åtgärdat: samma titelvärde används som synlig rubrik och tillgängligt namn, utan en separat duplicerad rubrik. `ModalLayer` äger modaliteten enligt F1; designsystemets innehålls-/knapppresentationer behålls. `onClose` kopplas till befintlig avbrytväg, så Escape fungerar och säkra avbrytknappen får initialt fokus. Komponenttester hittar samtliga tre dialoger med namn och skyddar avbrytknappens beteende utan att skicka data. Verklig fokus-/Escape-verifiering görs i webbläsartester, inte genom en simulerad native dialog i jsdom.

#### F4 · P2 · Rapportera-länken har för låg textkontrast

Ägare: `frontend/src/layouts/base-errand-layout/base-errand-layout.component.tsx` och dess knapp-/sidhuvudsfärger.

På desktop i **ljust läge** är texten `#e5e5e5` mot den effektiva bakgrunden `#696973`: **4,31:1**, under 4,5:1 för normalstor text. Länken är aktiv (`href=/iaf/arende/registrera`), utan disabled/aria-disabled; undantaget för inaktiva kontroller gäller inte. Samma länk ger axe-avvikelse på grundinformation och meddelanden. Mörkt läge klarade kontrollen.

Kriterium: [1.4.3 Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Åtgärdat: den befintliga länken använder designsystemets sekundära/inverterade variant. `header-accessibility.spec.ts` mäter minst 4,5:1 i ljust/mörkt läge och normal-, hover- och fokustillstånd. Inga nya färgtokens eller parallella knappimplementationer infördes.

#### F5 · P1 · Inloggningsknappen klipps i smal vy

Ägare: `frontend/src/components/auth/login-content.component.tsx`.

Vid 320 px ligger Logga in-knappen mellan x=242,39 och x=369,39. En del av den primära funktionen hamnar utanför vyn. Webbläsarmätning och visuell kontroll bekräftar detta trots noll axe-avvikelser. Layouten behåller en horisontell rad med stort mellanrum och sidpadding på smal skärm.

Kriterium: [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Åtgärdat: befintlig inloggningslayout staplar innehåll på smal skärm, med anpassad padding och radbrytbar knapptext. `confirmation-login-accessibility.spec.ts` provar inloggnings- och utloggat-vy vid 320 CSS-pixlar på svenska/engelska, med normal och dubblerad rotfontstorlek. Detta ersätter inte test med faktisk webbläsarzoom eller extern SSO.

#### F6 · P1 · Ärendesidans mobilhuvud klipper navigationen

Ägare: `frontend/src/layouts/app-header.component.tsx` och dess varumärkes-/statusrad.

På meddelandesidan vid 320 px ligger språkknappen mellan x=284,23 och x=354,92 och är delvis utanför vyn. Öppna meny ligger mellan x=362,92 och x=402,92, helt utanför vyn. Ärendenumret fortsätter till y=85 medan sidhuvudet är 78 px högt. Mätningen har kompletterats med visuell kontroll; detta är ett separat fel i det gemensamma sidhuvudet, inte i den rättade editorn. Mätvärdena är lokala och ska omtestas med produktionsfonterna enligt miljöbegränsningen ovan.

Kriterium: [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Åtgärdat: AppHeader låter varumärke/status och kontroller använda två rader på mobil med naturlig texthöjd. Ingen navigation eller ärendeinformation döljs. `header-accessibility.spec.ts` kontrollerar hela kontrollernas geometri och hit-testing vid 320/1536 CSS-pixlar på svenska/engelska, med fungerande fontfiler.

### Gemensam avgränsning och återställning

De befintliga komponenterna behåller ägarskap över innehåll och verksamhetsbeteende. Den modala livscykeln har fått en gemensam ägare för paneler och dialoger, eftersom bibliotekets befintliga primitiv inte klarade beteendeprovet. Meddelande-, notifierings-, inloggnings- och rapport-API:er, datakontrakt, scheman och skickanderegler ändras inte. Inga beroenden har lagts till.

Rättningarna kan återställas per komponent och motsvarande test utan datamigrering. Huvudriskerna är dialogers livscykel i andra webbläsare samt layout med andra text-/schemainnehåll; de kvarstår i den manuella verifieringsplanen.

### Genomförd editorrättning

Den ursprungliga editorrättningen kompletteras nu av F1–F6 ovan:

- Höjden sätts på Quills inmatningsyta i stället för den yttre behållaren. Verktygsfältets höjd ingår därmed i sidflödet och hjälptext/räknare ligger nedanför hela editorn.
- Verktygsfältet får radbrytas så att knapparna ryms vid 320 px.
- Befintlig ARIA- och etikettfokuskod **flyttades** från schemawidgeten till `RichTextEditor`. Ingen andra DOM-anpassning kopierades in i meddelandeformuläret.
- `MessageComposer` äger fortsatt gräns, räknare och fel. Editorn kopplas till etikett, obligatoriskhet, maxgräns, begripligt aktuellt teckenantal samt aktuellt fel. Den visuella kortformen döljs för hjälpmedel till förmån för beskrivningen i ord.
- En beständig artig statusregion meddelar ändrade valideringsfel. Räknaren ligger inte i en live-region som annonserar varje tangenttryckning. Hjälptexten får inget extra tabbstopp.
- Två tidigare separata felpresentationer sammanfördes till ett aktuellt fältfel. Skickande, bilagor, gränsvärde och befintlig trim-baserad teckenräkning ändrades inte.

Uppmätt textkontrast på meddelandesidan:

| Färgläge | Text | Effektiv bakgrund | Kontrast |
| --- | --- | --- | --- |
| Ljust, hjälptext/räknare | `#444450` | `#ffffff` | 9,60:1 |
| Ljust, gränsfel | `#971a1a` | `#ffffff` | 8,47:1 |
| Mörkt, hjälptext/räknare | `#e5e5e5` | `#2f2f3c` | 10,47:1 |
| Mörkt, gränsfel | `#fee2e2` | `#2f2f3c` | 10,79:1 |

Alla dessa prover ligger över textkravet 4,5:1. Det är inget generellt godkännande av appens alla färger eller editorinnehåll.

### Omtest efter samtliga rättningar

Samma sex sidor kontrollerades på nytt med samma axe-version och WCAG-taggar, vid 1536 × 960 och 320 × 960 CSS-pixlar i **både ljust och mörkt läge**: totalt 24 sidtillstånd. Samtliga fyra statiska Raleway-vikter verifierades som inlästa före kontrollen. Inloggningssidan och meddelandesidan granskades även visuellt vid 320 px.

| Vy under `/iaf` | axe-avvikelser, ljust desktop / mobil | axe-avvikelser, mörkt desktop / mobil |
| --- | --- | --- |
| `/login` | 0 / 0 | 0 / 0 |
| `/oversikt` | 0 / 0 | 0 / 0 |
| `/arende/AIA-25120019/grundinformation` | 0 / 0 | 0 / 0 |
| `/arende/AIA-25120019/meddelanden` | 0 / 0 | 0 / 0 |
| `/arende/registrera` | 0 / 0 | 0 / 0 |
| `/arende/inskickad` | 0 / 0 | 0 / 0 |

Två slags kontrastnoder har `incomplete` i båda färglägena i den initiala sidkörningen. Dessa följdes upp separat:

- Desktopöversiktens `#rowHeight` (Radhöjd: Normal/Tät): bakgrundsbilden är enbart select-kontrollens SVG-pil. Separat färg-/alfamätning gav text-/pilkontrast 7,54:1 i ljust normalläge och 5,53:1 i mörkt normalläge. Vid fokus är lägsta uppmätta kontrast 12,88:1 respektive 6,96:1. Samtliga nio hit-testpunkter träffade kontrollen och fokusringen var synlig. Ingen brist bekräftades i dessa prover.
- Mobilregistreringens Sök på personnummer under Övriga parter: nedersta delen låg initialt utanför formulärets skrollyta. Vanlig Tab från Person-valet scrollade hela fältet in i vyn med synligt fokus. Efter scroll och neutral testtext gav separat axe-prov av fältet varken avvikelse eller `incomplete` i något färgläge. Ingen sökning skickades. Provet bekräftar inte alla placeholder-/fältgrupptillstånd.

`Incomplete` räknas inte som ett automatiskt godkänt resultat. Noll axe-avvikelser gäller endast dessa avgränsade tillstånd; fynd som F1/F2/F5/F6 kräver beteende-, geometri- eller visuell kontroll och kan inte uteslutas med axe ensamt.

### Regressionstester och körningar

Kör från `frontend`:

```sh
yarn test
yarn type-check
yarn lint
NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn e2e --reporter=line
NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn build
```

Kör produktionsbygget efter att devservern stoppats, eftersom de använder samma `.next`-katalog.

Resultat efter samtliga rättningar: **276 godkända enhetstester, 6 överhoppade**, typkontroll, lint och produktionsbygge godkända, **60 av 60 E2E-tester godkända**. API-anrop i registreringstesterna besvaras av fixtures. Axe-granskningen ovan var en separat explorativ körning och har inte införts som en permanent CI-grind eller nytt beroende.

Nya beständiga regressionsskydd:

- `frontend/tests/unit/components/rich-text-editor.test.tsx`: etikettfokus, uppdatering/borttagning av ARIA, readonly/disabled och ersatt Quill-yta.
- `frontend/tests/unit/components/message-composer.test.tsx`: svenska/engelska tillgängliga beskrivningar, räknaruppdatering, obligatoriskhetsfel, gränsen 10 000/10 001 och återhämtning från för lång text.
- `frontend/e2e/tests/messages-accessibility.spec.ts`: verklig Quill, gränsfel/fokus, hjälptext nedanför editorn samt verktygsfält och räknare inom desktop-/mobilvyn.
- `frontend/e2e/tests/overlay-accessibility.spec.ts`: native modalitet, verkligt nekad bakgrundsfokusering, stängd dialogs CSS-synlighet, backdrop, Tab/Shift+Tab, Escape, fokusåterställning och återöppning.
- `frontend/tests/unit/components/confirmation-dialog-accessibility.test.tsx`: de tre bekräftelsernas namn och avbrytknapp utan sparanrop. Fokus/inerthet mockas inte fram som evidens i jsdom.
- `frontend/e2e/tests/confirmation-login-accessibility.spec.ts`: inloggning/utloggat på svenska och engelska vid 320 px med normal/dubbel rotfont. Avbryt och Skicka-bekräftelsernas namn, modalitet, bakgrundsfokus, Tab/Escape, återöppning och centrerade geometri vid 1536/390/320 px; Avbryt även på engelska vid 320 px.
- `frontend/e2e/tests/stakeholder-modal-accessibility.spec.ts`: manuell-part-dialogens modalitet, bakgrundsfokus, stängning/återöppning, centrerade geometri och lokala validering/sparning på svenska/engelska vid 320/390/1536 px.
- `frontend/e2e/tests/header-accessibility.spec.ts`: synlig skip-länk, fokus till innehåll, normal/hover/fokus-kontrast i båda färglägena och headergeometri på svenska/engelska vid 320/1536 px.
- `frontend/e2e/tests/login.spec.ts`: den faktiska rubrikfonten laddas under appens konfigurerade base path.

DOM-tester av `aria-live` bevisar att annonseringskontraktet finns, inte hur en viss skärmläsare faktiskt läser upp det. Återställning av editorrättningen är lokal till komponenter, översättningar och tester; ingen data eller schema behöver migreras.

### Fortsatt manuell kontroll – inte konstaterade kriteriefel

- Mobilöversikten saknar `main` och `h1`, och översiktsskalet saknar skip-länk. Frånvaron ensam räcker inte för att slå fast ett visst WCAG-fel; effektiv blockförbikoppling och rubrikstruktur behöver utvärderas i hela flödet.
- Mobilwizardens stegbyte behöver testas för fokusplacering och begriplig annonsering av det nya steget.
- Sticky åtgärdsrader, språkpaneler, alla formulärsteg, fel/konflikter, bilagor, textavstånd, 200/400 % faktisk zoom och långa engelska texter behöver en komplett manuell genomgång.
- Sessionstidsgränser och tillgänglig autentisering behöver granskas tillsammans med den riktiga SSO-miljön. `InactivityMonitor` är inte monterad i appen och redovisas därför inte som ett aktivt produktfel.

## Reviewbara kodslices

### Tabellprimitiver

Ägare: ärendetabellen.

Genomfört och automatiskt verifierat:

- explicit `tbody` genom designsystemets `Table.Body`;
- en riktig, namngiven länk i stället för en klickbar och tabbfokuserbar tabellrad;
- annonserad initial laddningsstatus;
- beteendetest för länk, tabellstruktur och laddningsstatus.

Detta tar bort dubblerad tangentbordslogik och gör navigationens semantik entydig.

### Kontroll- och menysemantik

Ägare: respektive navigation-, meny-, filter- och notifieringskomponent.

Genomfört och automatiskt verifierat:

- riktiga länkar för navigationskontroller och flikar;
- funktionella tillgängliga namn på ikonknappar och menyutlösare;
- notifieringsantal, `aria-expanded` och `aria-controls`;
- radio-grupper för färgläge med gemensamt namn och översatta etiketter;
- dekorativa ikoner döljs för tillgänglighetsträdet;
- borttagning av positivt `tabIndex` från skip-länk;
- en enda interaktiv kontroll i mobilens ärendekort;
- beteendetester som skyddar de centrala kontrollkontrakten.

### JSON Schema-formulär

Ägare: JSON-formulärets gemensamma fält-, widget- och sanitiseringslager.

Genomfört och automatiskt verifierat:

- gemensam etikett-, hjälptext-, fel- och obligatoriskhetskoppling;
- native `fieldset`/`legend` för radiogrupper;
- korrekt `disabled`, `readonly`, fokus och invalid-status i berörda widgetar;
- SSR-säker länksanering utan renderingsberoende av `DOMParser`;
- fail-closed hantering av länkars `target` och säker `_blank`-presentation;
- språkneutral new-tab-indikering via i18next-resurs;
- beteende- och SSR-tester för dessa kontrakt.

## Kända gap som blockerar ett konformitetsintyg

### P1 – dialogkontrakt behöver fler hjälpmedels- och webbläsarprov

Notifieringspanelen, översiktens mobilmeny, bekräftelserna och manuell-part-dialogen har nu ett gemensamt, webbläsartestat dialogkontrakt enligt F1/F3. Detta täcker inte alla formulärvarianter i alla webbläsare/hjälpmedel. Initialt fokus, modal bakgrund, Escape, synlig stängning och fokusåterställning behöver också verifieras i den manuella matrisen. Att bara använda `role="dialog"` eller visa en panel visuellt är inte tillräckligt.

Acceptans:

- en gemensam dialogägare eller designsystemsprimitiv används;
- beteendetester verifierar initialt fokus, Tab/Shift+Tab, Escape och fokusåterställning;
- manuell skärmläsar- och tangentbordskontroll dokumenteras.

### P1 – komplett tangentbords- och skärmläsarprocess saknas

Registrera ärende, filtrera/sortera, öppna och uppdatera ärende, notifieringar, session/logout samt fel- och konfliktflöden behöver köras från början till slut utan mus.

Acceptans:

- alla funktioner kan genomföras med tangentbord;
- fokusordning, fokusindikering och dynamiska meddelanden dokumenteras;
- testprotokollet anger hjälpmedel, webbläsare, version, testare och datum.

### P1 – visuell och responsiv verifiering är ofullständig

Kontrast, textförstoring, reflow, textavstånd, orientering och färgoberoende behöver granskas på båda färglägena och i alla viktiga tillstånd, inklusive fel, fokus, disabled och hover.

Acceptans:

- mätresultat och skärmbilder länkas per berört kriterium;
- avvikelser får ägare, prioritet och regressionstest där det är möjligt.

### P2 – språkstöd måste tillgänglighetstestas per locale

När ett andra språk aktiveras måste dokumentets `lang`, locale-routing, långa etiketter, felmeddelanden, uppläsning och reflow verifieras på varje språk. JSON Schema-översättningar får endast ändra presentation; värden, egenskapsnamn, enumvärden, schema-ID och valideringsregler ska förbli identiska.

Acceptans:

- samma verksamhetsdata serialiseras identiskt för varje locale;
- tillgängliga namn och beskrivningar är fullständiga och begripliga på respektive språk;
- automatiserade tester körs per locale och kompletteras manuellt.

### P2 – löpande regressionsgrind behöver formaliseras

CI bör köra typkontroll, lint, komponenttester, produktionsbygge och en automatiserad tillgänglighetskontroll på representativa sidor. Resultatet ska följas upp, men verktygsresultatet får inte ensamt användas för att hävda konformitet.

## Rekommenderad evidensmatris

Förvalta en rad per WCAG-kriterium med minst följande fält:

| Fält | Innehåll |
| --- | --- |
| Kriterium | Nummer, namn och nivå |
| Omfattning | Berörda sidor, komponenter och processer |
| Utfall | Godkänd, underkänd, ej testad eller ej tillämplig |
| Evidens | Test, skärmbild, mätning eller protokoll |
| Metod | Automatisk, manuell eller båda |
| Miljö | Webbläsare, OS, hjälpmedel och version |
| Ägare | Ansvarigt team eller komponentägare |
| Datum | Senaste verifiering och nästa omtest |
| Avvikelse | Länk till issue/PR och planerad åtgärd |

## Definition of done för WCAG 2.2 AA

Katla får beskrivas som WCAG 2.2 AA-konform först när:

1. samtliga sidor och kompletta processer i definierad omfattning har utvärderats;
2. varje tillämpligt A- och AA-kriterium har dokumenterad evidens utan öppet blockerande fel;
3. tangentbord, skärmläsare, zoom/reflow, kontrast och dynamiska tillstånd har testats manuellt;
4. automatiserade regressionstester och en återkommande manuell omtestprocess finns;
5. undantag, tredjepartsberoenden och eventuella partiella konformitetsuttalanden är juridiskt och verksamhetsmässigt granskade;
6. rapporten anger version/commit, testmiljö, datum, ansvarig och giltighetsperiod.

## Referenser

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2: <https://www.w3.org/TR/WCAG22/>
- WAI-ARIA Authoring Practices, Modal Dialog Pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- W3C WAI, Evaluating Web Accessibility Overview: <https://www.w3.org/WAI/test-evaluate/>
- HTML Standard, dialog: <https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element>
- MDN, `HTMLDialogElement.showModal()`: <https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal>
