# Astryx utilities i Katla

Granskad mot den installerade versionen **0.5.2**, dess CLI-dokumentation och publicerade källkod under `@astryxdesign/core/src`. Webbplatsen kan beskriva en annan version. Det här är ett beslut om befintliga behov, inte en lista över nya beroenden att lägga till.

## Genomförda förenklingar

| Utility | Beslut och ägare |
| --- | --- |
| `LinkProvider` | Införd i `AppLayout` med Next.js `Link`. Astryx knappar, flikar, rubriklänkar och textlänkar får routing från samma ägare. `LinkButton` och upprepade `as={NextLink}` tas bort. Länkar förblir riktiga ankare; Next äger basePath och klientnavigation. Befintliga rena Next-länkar behöver inget extra omslag. |
| `useMediaQuery` | Ersätter den egna hooken direkt i översikt, ärendelayout och notifieringspanel. Bibliotekets `useSyncExternalStore` äger prenumeration och avregistrering; appen behåller sin breakpoint och sina layoutbeslut. SSR använder fortfarande `false`. Notifieringsknappens hydreringsspärr behålls och testas; hooken gör inte servern medveten om skärmbredden. |
| `useClickableContainer` | Används i tabellens radkomponent med referens till dess enda riktiga länk. Tar bort `router.push` och länkens `stopPropagation`. Textmarkering och nästlade kontroller respekteras. Mobilens `ListItem` använder samma biblioteksbeteende genom `interactiveRef`. Ny flik och webbläsarens länkkommandon finns på den riktiga länken; ingen extra tangentbordsroll sätts på raden. |

Tre helt oanvända komponenter för sökruta/filterpanel är också borttagna: `ErrandFilter`, `ErrandFilterQuery` och `Filtering`. De saknade anslutning till översiktens hämtning och hade inga konsumenter redan före UX-ändringen. Den aktiva statusfiltreringen, sorteringen och pagineringen finns kvar hos befintliga stores och `useOverviewErrands`.

## Befintliga ägare behålls

| Utility | Bedömning |
| --- | --- |
| `InternationalizationProvider` | Redan införd i `LocalizationProvider` med samma route-locale som i18next och Astryx svenska katalog. Bibliotekets texter och appens verksamhetstexter har olika kataloger men samma språkval. |
| `LayerProvider` | Redan en gemensam provider för bland annat toast. Inga extra providers per sida eller egna globala overlay-rötter behövs. |
| `Theme` | Redan införd. `katla.ts` är profilens källa; CSS och temaobjekt byggs i förväg. Färglägesvalet fortsätter lagras av appens befintliga store. Kontrast justeras med Astryx färgskala, inte komponentvisa CSS-undantag. |
| `useFocusTrap` | Används redan för appens dialoger. Biblioteket äger fokusbegränsning; respektive formulär äger öppning, sparning och avbrytande. Persondialogens livscykel vid avmontering behålls med sina regressionstester. |
| `useScrollLock` | Astryx `Dialog` använder detta internt. Ett extra anrop i appen skulle skapa ännu en ägare till samma scroll-lås. |
| `useLayer` | Dropdown, tooltip och andra färdiga överlägg äger placering och stängning. Ingen egen overlay motiverar att appen använder den lägre nivån. |

## Utvärderade utan nya anrop i appen

| Utility | När den vore motiverad och varför den inte läggs till nu |
| --- | --- |
| `useAnnounce` | För ett imperativt resultat som saknar annan korrekt live-region. Våra vyer har status-/felregioner och Astryx toast har egen annonsering. Lägg inte samma meddelande i båda. Initial laddningsannonsering bör även bedömas med riktig skärmläsare; ett DOM-test bevisar inte att en uppläsning hörs. |
| `useClipboard` | Rätt ägare om en kopieringsfunktion införs: skrivning, återställning och annonsering hör ihop. Ingen befintlig kopieringsimplementation finns att ersätta. Ett misslyckat `copy()` måste hanteras; hooken returnerar `false`. |
| `useCollator` | För klientbaserad, språkberoende sortering. Rapportlistan sorteras och pagineras av API:t; lokal omsortering av bara den hämtade sidan skulle ge fel helhetsordning. |
| `useLocale`, `useTranslator` | Lämpliga för egna Astryx-komponenter. Appens namespaces, interpolation, valideringsöversättningar och språkbyte ägs redan av i18next. En andra översättningsmotor för samma apptexter skulle öka förvaltningen. |
| `MediaTheme` | För text/kontroller ovanpå bilder eller lokalt inverterade ytor. Katla har ingen egen sådan yta som behöver ytterligare kontext. Sidans mörka läge ägs av `Theme`. |
| `SyntaxTheme` | För kodblock. Rapporter och meddelanden är verksamhetstext, även när innehållet transporteras som HTML. |
| `useTheme` | När JavaScript behöver upplösta färger för exempelvis canvas eller diagram. Vanlig UI-styling använder redan tokens och komponentprops. |
| `useContainerReveal` | För sekundära åtgärder som visas vid hover/fokus. Rapportnavigation och huvudåtgärder ska vara synliga på mobil; ingen sådan gömd åtgärdsrad behövs nu. |
| `useEntryAnimation` | För motiverade inträdesanimationer. Skeleton och komponenternas befintliga rörelser räcker; ytterligare sidanimationer hjälper inte rapportflödet. Reducerad rörelse respekteras. |
| `useDevWarning` | För felaktig användning av en återanvändbar komponent under utveckling. Ersätter inte API-fel, användarmeddelanden eller driftloggning. Ingen egen sådan varningslogik hittades. |
| `useGridFocus`, `useListFocus`, `useTreeFocus` | För egenbyggda sammansatta kontroller. Astryx tabbar, val och menyer äger redan sin tangentbordsmodell. Rapporttabellen är en semantisk tabell med länkar, inte en redigerbar ARIA-grid; appen har inget träd. |
| `useTypeahead`, `useKeyboardHint` | Hör ihop med sammansatta val-/menykontroller. Använd de färdiga komponenternas beteende i stället för ett parallellt fokus- eller hintsystem. |
| `useHotkeys` | Om globala genvägar faktiskt införs. Befintlig inaktivitetsövervakning lyssnar på aktivitet, vilket är ett annat ansvar. Inga nya genvägar läggs ovanpå rich text eller formulär. |
| `useLongPress` | För en sekundär kontextmeny på touch. Ingen funktion ska bli beroende av en dold långtrycksgest. |
| `useImageMode` | För automatisk ljushetsanalys av bilder bakom kontroller. Bilagor kräver ingen sådan bildanalys. |
| `useIndicatorFocusRing` | För egna visuella checkbox-/radioindikatorer. Katla använder bibliotekets kontroller och deras fokusindikering. |
| `useInputContainer`, `useInputStatusIcon` | För en egen fullständig inputkomponent. Befintliga Astryx-fält äger dessa beteenden. RJSF-integrationen behåller sina externa id:n och sin felkoppling; en andra input-wrapper skulle ge dubbla ägare. |
| `useInteractiveRole` | För egna polymorfa byggstenar. `Button`, `Link`, `ListItem` och övriga färdiga komponenter räcker. |
| `useMergedRefs` | När flera ref-ägare behöver samma DOM-element. Ingen sådan duplicerad kombinationslogik finns nu. Lägg inte till en ref-adapter utan två verkliga konsumenter. |
| `useOverflow`, `useScrollOverflow` | För egen mätning eller indikatorer av innehåll som inte ryms. Astryx layout och fliklist hanterar nu aktuella ytor. Ingen ytterligare `ResizeObserver` eller mätloop behövs. |
| `useStreamingText` | För strömmande text. Meddelande-API:t levererar färdiga meddelanden; skrivmaskinseffekt skulle fördröja läsning utan att visa verklig laddningsstatus. |

## Kontrakt och förvaltning

Browserkontroller skyddar klientnavigation för registreringsknapp och tabellrad, en enda länk per rapport, textmarkering utan navigation, mobil/desktop-byte, första notifieringsklicket, tabbar och fokus. Befintliga tester för payload, språkbyte och oskickat innehåll ligger kvar. Utfallen och källcommit för bilder redovisas i [migreringsrapporten](astryx-evaluation.md).

Ingen ny dependency, data-/API-migrering eller generell utility-modul införs. Utilities-ändringen kan återställas separat från UX-layouten. Vid en Astryx-uppgradering ska dessa integrationskontrakt köras igen; bibliotekets interna testsuite ersätter inte verifiering av vår användning.
