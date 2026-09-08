# Plan: en gemensam bas för flera Katlor

Status: Implementation i separat worktree enligt denna målbild. Se [introduktionsguiden](adding-a-katla.md) för de faktiska kommandona och [driftguiden](katla-operations.md) för images, övergång och kvarstående extern acceptans. Planens nulägesbeskrivning och illustrativa kod beskriver ursprungligt underlag; guiderna och den aktuella koden är implementationsreferens.

Datum: 2026-09-07.

## 1. Mål och föreslaget beslut

En ny Katla som använder samma grundflöde ska kunna införas genom att lägga till en liten applikationsdefinition, ange dess JSON-scheman och konfigurera driften. Design, formulärhantering, inloggning, ärendeöversikt och inskickning ska återanvändas.

Förslaget är:

- Ett repo med workspaces för befintlig frontend, befintlig backend och applikationsdefinitioner.
- En gemensam frontendimplementation och en gemensam backendimplementation.
- En definition per Katla, med namn, schemareferenser och ett fåtal uttryckliga verksamhetsval.
- En vald Katla per driftsatt ärendeinstans. Varje Katla kan ha egen adress, åtkomst och release.
- En gemensam inloggad startsida, ”Mina Katlor”, som visar de publicerade Katlor användaren har åtkomst till.
- Gemensamt standardflöde för schemaformulär. Dagens avvikelseflöde får en egen tydlig ägare för sina verksamhetsregler.
- Fortsatt användning av Astryx och JSON Schema-tjänsten som befintliga ägare.

Utgångspunkten är att Katlorna använder SupportManagement och att deras övergripande ärendelivscykel är likartad. En framtida Katla med en annan ärendetjänst eller ett väsentligt annat arbetsflöde kräver ett nytt avgränsat beslut.

Repoindelning och drift hålls isär: gemensam kod innebär att en rättning kan användas av alla, medan varje instans kan uppgraderas till en verifierad release vid vald tidpunkt.

Investeringen bedöms vara motiverad om fler Katlor använder denna gemensamma grund. Vinsten är både kortare introduktion och att löpande rättningar av formulär, tillgänglighet och integration får en gemensam ägare. Tidsvinsten är ännu inte uppmätt. Piloten ska visa hur mycket arbete som återstår i applikationen respektive i externa system innan fler abstraheringar införs.

## 2. Problem, nuläge och ägarskap

Det mesta av gränssnittet kan återanvändas, men avvikelseregler är utspridda i annars gemensam kod. Att lägga till fler scheman utan att först samla dessa regler skulle göra nya Katlor beroende av avvikelsens begrepp och validering.

| Område | Nuläge i koden | Föreslagen ägare och åtgärd |
| --- | --- | --- |
| Grunddesign | Katlas tema bygger på Astryx neutral. | Astryx äger grundkomponenter och tokens. Frontend behåller ett gemensamt Katla-tema och gemensamma layouter. |
| Applikationsval | Appnamn och fem funktioner läses från miljövariabler i `appConfig`. | Katla-definitionen äger produktval. Driftskonfigurationen äger miljöberoende anslutningar och hemligheter. |
| Schemaformulär | RJSF, standardfält, felvisning och schemaladdning finns. Schemalistan innehåller ett hårdkodat avvikelseschema. | Fördjupa befintlig formulärhantering så den använder aktiv definitions schemalista. Flytta ut avvikelsebindningen. |
| Specialfält | Formulärkomponenten registrerar verksamhetens platsväljare direkt. | Standardfält stannar i formulärhanteringen. Avvikelseflödet tillför platsfältet med RJSF:s befintliga stöd för egna fält. |
| Sektioner och steg | Desktop och mobil beskriver delvis strukturen var för sig. | Ett flöde äger ordning, synlighet och vilka regler som gäller. Båda presentationerna använder det underlaget. |
| Validering och inskickning | Desktopens knappgrupp och mobilens knapprad har egna spar-, validerings- och inskickningsvägar. Personkrav skiljer sig också mellan dessa vägar. | Samla sparning och inskickning i en ägare. Gemensam validering anropar verksamhetsreglerna; skillnader i dagens regler avgörs uttryckligen före sammanslagning. |
| Rapporttyper och parter | `eventType`, `eventConcerns`, avvikelse/missförhållande och brukarregler används på flera ställen. | Avvikelseflödet äger dessa begrepp, inklusive texter i översikt och sammanfattning. |
| Mappning till ärende | `usePrepareErrand` bygger labels och parter från rapporttyp och plats. | Avvikelseflödet äger den verksamhetsspecifika mappningen. Gemensam serialisering bevarar `key`, `value` och `schemaId`. |
| Ärendets grundvärden | Ärendelayouten sätter bland annat titel, prioritet, kanal och resolution när formuläret skapas. | Samla ärendeinitiering med den gemensamma ärendehanteringen. Verifiera grundvärdena med mottagaren; fasta verksamhetsskillnader anges typat i definitionen och härledda värden ägs av flödet. |
| Statusar | Metadata ger statusnamn, men `DRAFT`, `NEW` och `SOLVED` har särskild betydelse i klienten. | Metadata fortsätter äga visningsnamn. Befintlig statusmodul äger en explicit livscykel som nya Katlor behöver stödja. |
| Åtkomst och drift | Backend använder kommun-id, namespace och tillåtna grupper från miljön. Sessionens namn och sökväg konfigureras. | Backend och driftskonfiguration äger åtkomst och mål. Klienten kan aldrig välja ett annat namespace genom formulärdata. |
| Lokal lagring | Bland annat wizard och sortering använder generella lagringsnycklar. | Befintliga lagringsägare avgränsar nycklar med Katla-id. Ärendebunden wizardposition behöver också bindas till aktuellt ärende. |

Konkreta utgångspunkter: [appConfig](../frontend/src/config/appconfig.tsx), [SchemaForm](../frontend/src/components/json/schema/schema-form.component.tsx), [ärendemappning](../frontend/src/hooks/use-prepare-errand.ts), [desktopens inskickning](../frontend/src/layouts/errand-button-group.component.tsx) och [mobilens inskickning](../frontend/src/components/wizard/wizard-bottom-bar.component.tsx).

## 3. Struktur

Behåll dagens frontend- och backendmappar. Lägg till ett litet paket för Katla-definitioner. Nedan visas målstrukturen; nya namn och filer är förslag.

```text
web-app-katla-sm/
  package.json                 # Privat workspace-rot och gemensamma kommandon
  yarn.lock                    # En gemensam låsfil

  frontend/                    # Den gemensamma Next.js-applikationen
    src/
      components/              # Gemensamma gränssnitt och schemaformulär
      layouts/                 # Gemensam sidstruktur
      theme/                   # Gemensam Katla-profil på Astryx
      flows/
        schema/                # Rapportör, schemafält, sammanfattning
        avvikelse/             # Avvikelsens sektioner, regler och mappning

  backend/                     # Den gemensamma backendapplikationen
    src/                       # Befintliga API-, schema- och inloggningsägare

  katlor/                      # Workspace-paket: @katla/definitions
    package.json
    src/
      definition.ts            # Typat och validerat definitionskontrakt
      index.ts                 # Explicit lista över definitionerna
      avvikelse/
        definition.ts
        README.md              # Ägare, schema och verksamhetsförutsättningar
      <ny-katla>/
        definition.ts
        README.md

  docs/
    katla-monorepo-plan.md
    adding-a-katla.md           # Introduktionsguide som utformas från första steget
```

Paketet med definitioner innehåller data och dess kontrakt. Det importerar varken React, frontend, backend eller hemligheter. Frontend och backend använder samma definition. Frontend äger konkreta flödesimplementationer och väljer bland de uttryckligen stödda flödena.

En ny Katla med befintligt flöde kräver en definition och en registrering i listan. Ny verksamhetskod tillkommer bara om ett verkligt krav inte ryms i de befintliga flödena. Gemensamma komponenter ska inte kontrollera specifika Katla-id:n.

Frontend är redan den gemensamma konsumenten av designen. Ett separat internt UI-paket ger därför ingen ytterligare återanvändning i första steget. Ett sådant paket blir aktuellt om flera självständiga frontendapplikationer senare behöver samma Katla-komponenter.

## 4. Vad en Katla definierar

Följande är ett illustrativt exempel på den lilla definition som införandet ska möjliggöra. Namn och schema är exempel; detta är ingen befintlig eller färdig konfiguration.

```ts
export const itBestallning = {
  id: 'it-bestallning',
  applicationName: 'IT-beställning',
  flow: 'schema',
  forms: [{ schemaName: 'it-bestallning-arendeuppgifter' }],
  features: {
    draftEnabled: true,
  },
} satisfies KatlaDefinition;
```

Kontraktet ska ge följande beteende:

- `id` är unikt, stabilt och används för val av Katla och avgränsning av lokal lagring.
- `flow` är ett typat val. Första uppsättningen är `schema` och `avvikelse`.
- `forms` är en ordnad lista. Dagens stöd för flera formulärposter återanvänds.
- Funktioner som utelämnas får dokumenterade standardvärden på ett enda ställe. Avvikelsens nuvarande effektiva inställningar anges uttryckligen vid övergången.
- Okänt id, okänt flöde, dubbla scheman eller ogiltig konfiguration ger ett begripligt fel före användning. Ingen Katla väljs tyst som reserv.
- Servern validerar laddad konfiguration vid start; TypeScript-kontroll ensam räcker inte för miljövariabler och externa svar.

Första kontraktet utgår från de funktioner som redan finns. Varje befintlig flagga får ett dokumenterat syfte och beroenden. Verksamhetsspecifika val hör till rätt flöde. Nya flaggor tillkommer först när ett faktiskt behov och dess beteendetest finns.

Exemplet förutsätter att standardflödets ärendegrund passar mottagaren. Titel, prioritet, kanal, resolution och eventuell klassificering kontrolleras vid anslutning. Definitionen kan få uttryckliga fält för fasta värden som verkligen behöver variera; ett fritt objekt som får skriva över hela API-payloaden ingår inte. Även behov av andra språk, meddelanden och bilagor stäms av med piloten innan nya konfigurationsval införs.

API-adresser, kommun-id, namespace, SAML-inställningar, sessionshemligheter och certifikat hör till driftskonfigurationen. Reglerna för tillåtna grupper hör till den gemensamt förvaltade serverkonfiguration som både katalogen och respektive Katla använder, enligt avsnitt 6a. Frontend får endast uttryckligen publika uppgifter. Katla-definitionen ska inte bli en kopia av alla miljövariabler.

## 5. Schema, presentation och ärendekontrakt

JSON Schema-tjänsten fortsätter äga schemaidentitet, versioner, definitioner och UI-schema. Katla-definitionen refererar till publicerade scheman. Schemaändringar kan därmed förvaltas där de redan hör hemma.

JSON Schema beskriver uppgifternas struktur och validering. UI-schema beskriver presentation, exempelvis ordning, hjälptexter och widgetval. Verksamhetsregler som kräver metadata, personroller eller mappning till labels ägs av flödeskoden.

Följande gäller för alla Katlor:

1. Ett nytt formulär hämtar initialt senaste versionen enligt dagens beteende och binds därefter till det returnerade schema-id:t.
2. Sparade uppgifter visas och valideras mot exakt sparat `schemaId`. De märks aldrig om automatiskt med en senare version.
3. Felaktigt eller saknat schema-id stoppar berörd redigering och inskickning med ett tydligt fel. Inmatade uppgifter bevaras.
4. `key`, `value`, `schemaId` och stabila maskinvärden bevaras genom sparning och återöppning.
5. UI-schema och språkbyte kan påverka presentationen men får inte ändra sparad verksamhetsdata.
6. Krav på nya formulär kommer från aktiv definition. Befintliga ärendens formulärposter måste också hanteras utifrån det som faktiskt sparats. En post får inte försvinna bara för att den saknas i dagens lista.
7. Att lägga till, ta bort eller byta namn på obligatoriska formulär för en Katla med sparade utkast kräver en uttrycklig bedömning av de gamla utkasten. Historiska uppgifter och kraven för att slutföra dessa utkast ska hanteras enligt ett dokumenterat beslut.
8. Den visuella editorn fortsätter stödja de objektscheman den klarar i dag. Andra befintliga JSON-värden ska bevaras av transporten; stöd för nya editorformat bedöms separat.

Valet att använda senaste version vid nya formulär bevarar dagens funktion, men innebär att en publicerad schemaändring kan påverka nya registreringar direkt. Om verksamheten behöver styra schemaaktivering per release bör ett uttryckligt versionsval läggas till som ett separat beslut.

Lokala schemakopior och override-stöd inventeras. Om de endast är referenser flyttas användbara exempel till testunderlag eller dokumentation, och den oanvända produktionsvägen tas bort efter verifiering. Det ska finnas en aktiv källa för schemaändringar.

Draken och Katla behöver vara överens om uppgifternas betydelse och ärendemappningen. Backend fortsätter kommunicera med SupportManagement. Införandet kräver ingen koddelning med Drakens gränssnitt.

## 6. Gemensamt flöde och verksamhetsskillnader

Standardflödet är: rapportör → schemaformulär → sammanfattning → skicka in → kvitto. Utkast, översikt och befintliga ärendevyer återanvänds enligt aktiverade funktioner.

Avvikelseflödet behåller sina extra uppgifter om rapporttyp, vem händelsen berör, brukare, andra parter och plats. Dess regler flyttas till den ägaren. En Katla som använder standardflödet ska exempelvis kunna skickas in utan `eventType`, `eventConcerns` eller avvikelsens platslabels.

Flödet behöver uttryckligen beskriva sina sektioner, synlighetsregler, verksamhetsvalidering och mappning till ärende. Använd vanliga TypeScript-funktioner och befintliga komponenter. Ett litet internt kontrakt mellan de två konkreta flödena räcker; kontraktet utformas från den kod som faktiskt behöver återanvändas.

Desktop och mobil använder samma aktiva sektioner, slutvalidering och spar-/inskickningsfunktion. Presentationen får skilja sig. Stegvalidering kan visa den del av samma felunderlag som hör till aktuellt steg.

Sammanfattning, tabellrader, mobilkort och inskickningsdialoger ingår i genomgången. Avvikelsens rubriker och tolkning av rapporttyp får inte följa med till andra Katlor av misstag.

Behörighet, tillåtna statusövergångar och giltiga inskickade uppgifter måste kontrolleras på serversidan. I införandet verifieras vad SupportManagement redan garanterar och vad Katlas backend behöver kontrollera. Åtkomststyrande labels får inte förlita sig enbart på klientvalidering. Eventuella luckor rättas i separata beteendeändringar före anslutning av ytterligare verksamheter.

## 6a. Gemensam startsida: Mina Katlor

Den nuvarande koden har ingen gemensam applikationskatalog. Rooten leder till inloggning och den inloggade startsidan till aktuell Katlas ärendeöversikt. Backend tar emot grupper från SAML och kontrollerar dem mot instansens `AUTHORIZED_GROUPS` vid inloggning. Detta är en grund att återanvända, men ingen färdig lösning för åtkomst till flera Katlor.

Det föreslagna användarflödet är:

1. Max öppnar den gemensamma Katla-startsidan och identifierar sig med organisationens inloggning.
2. Backend hämtar katalogen för rätt driftmiljö och bedömer vilka publicerade Katlor Max får använda utifrån verifierad identitet och grupptillhörighet.
3. Startsidan visar en enkel lista med namn, eventuell kort beskrivning och en länk att öppna varje tillåten Katla. Namn och beskrivning hämtas från Katla-definitionen; mål och publiceringsstatus kommer från driftskatalogen.
4. När Max öppnar en Katla verifierar den instansen sin egen session och åtkomst till aktuell Katla. Ärendebehörighet kontrolleras därefter enligt det befintliga ärendekontraktet.
5. Varje Katla har en gemensam länk tillbaka till ”Mina Katlor”. Befintliga direktlänkar till en Katla eller ett ärende fortsätter fungera genom dess inloggning.

Vilka Katlor just Max har rätt till är inte verifierat här. Det avgörs av identitetstjänsten och verksamhetens åtkomstregler, aldrig genom matchning på visningsnamn eller en personlista i frontend.

### En gemensam regel för synlighet och appåtkomst

Identitetstjänsten äger gruppmedlemskapet. En gemensamt förvaltad, typad serverkonfiguration kopplar Katla-id till åtkomstregel, adress och publiceringsstatus per miljö. Befintlig gruppkontroll fördjupas till att kunna bedöma en uttryckligt vald Katla. Portal och app använder samma regelägare och samma policyunderlag.

Katalogen kan laddas från organisationens befintliga konfigurationsleverans. Portalinstansen behöver de publicerade posterna; en Katla-instans behöver sin relevanta post. Införandet ska ersätta dubbla manuellt underhållna grupplistor, inte lägga en ny lista bredvid dagens `AUTHORIZED_GROUPS`. Policyrevision och uppdateringssätt behöver vara definierade så portalens synlighet och appens åtkomst inte glider isär när verksamhetsregler ändras.

Frontend får ett serverfiltrerat katalogsvar med endast id, namn, beskrivning och en konfigurerad mål-URL. Fullständiga gruppregler och otillåtna katalogposter skickas inte till webbläsaren. Appåtkomst kontrolleras också på servern för skyddade anrop, inklusive direktanrop som inte går via startsidan. Åtkomst till en Katla ger inte automatiskt åtkomst till alla dess ärenden. [OWASP: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

En registrerad definition blir synlig när den är driftsatt, publicerad i rätt miljö och tillåten för användaren. En utvecklare behöver därför inte lägga till en separat menylänk i frontend för varje Katla. Introduktionsguiden och kontrollkommandot omfattar även katalogposten och åtkomstregeln.

### Inloggning och sessioner

Portal och Katla använder samma identitetsleverantör. Målet är att Max identifierar sig på startsidan och sedan öppnar en Katla utan att ange sina uppgifter igen. Med separata instanser kan det fortfarande ske en kort SSO-omdirigering som skapar Katlans egen session. Detta ska verifieras med den faktiska identitetsleverantören och dess regler för exempelvis MFA.

Sessioner och kakor fortsätter vara separata per instans. Att dela identitetsleverantör innebär inte att portalens cookie kan användas som Katlans session. Portalens inloggning måste också skilja identifiering från tillgång till en enskild Katla: en identifierad intern användare kan behöva få beskedet att inga Katlor är tilldelade.

Dagens grupplista sparas i sessionen. En ändring av gruppmedlemskap upptäcks därför inte automatiskt genom att samma gamla lista kontrolleras igen. Före lansering ska maximal ålder på behörighetsunderlaget, krav på ny autentisering och eventuellt behov av snabb återkallelse vara beslutat och testat. Utloggningens omfattning ska också framgå; lokal utloggning får inte presenteras som att alla app- och IdP-sessioner säkert är avslutade.

### Implementation och drift

Startsidan blir en liten katalogfunktion i samma repo och använder samma design- och inloggningsägare. Förslaget behåller separata Katla-instansers releaser. Den gemensamma frontend-/backendkoden får ett explicit katalogläge för en portalinstans och ett läge för en vald Katla; katalogläge är inte ett formulärflöde.

Portalinstansen behöver endast identitet, katalog och åtkomstkontroll. Ärende-, personuppslags- och schemaendpoints ska inte registreras där, och dess startkonfiguration ska inte kräva ärende-API:ernas hemligheter. Detta håller den extra instansen avgränsad. Dynamiskt byte av namespace i en gemensam ärendebackend ingår fortsatt inte.

Image-modellen får ett extra frontendbygge för katalogen. Samma backendrelease kan köras i katalogläge respektive Katla-läge med rätt validerad konfiguration. Dockerfiler och byggpipeline är fortfarande gemensamma.

### Acceptans för startsidan

- Representativa testidentiteter med noll, en och flera tilldelningar ser rätt publicerade Katlor. Tom tilldelning visar ett tydligt besked och en väg till support.
- Ett fel när katalogen laddas visas som ett fel och kan inte förväxlas med att användaren saknar åtkomst.
- Otillåtna Katlor saknas i katalogsvaret. Direktlänk och direkt API-anrop nekas också av den aktuella appen.
- En ny publicerad Katla blir synlig från definition och serverkonfiguration utan en separat UI-ändring.
- SSO mellan startsida och två separata Katlor fungerar med organisationens verkliga inloggning. Avbruten inloggning och utgången session ger begripliga vägar vidare.
- Ändrad åtkomst slår igenom enligt beslutad policy för sessionsförnyelse och konfigurationsuppdatering.
- Portalinstansen kan starta utan ärende-API-hemligheter och exponerar inga ärendeendpoints.

## 7. Så införs en ny Katla

Utvecklarens första uppgift ska vara att konfigurera en verksamhet. För att följa standardvägen behöver utvecklaren känna till önskade uppgifter och mottagning, men inte förstå RJSF:s interna registrering, SAML-koden, workspace-paketeringen eller avvikelseflödets implementation.

1. **Beskriv mottagningen.** Ange ansvarig verksamhet, SupportManagement-namespace, åtkomstgrupper och vilket befintligt flöde som passar. Bekräfta att mottagaren i Draken kan använda uppgifterna och att namespace stödjer livscykeln.
2. **Förbered schema och UI-schema.** Publicera dem i JSON Schema-tjänsten enligt befintligt arbetssätt och skapa ett representativt giltigt och ogiltigt exempel. Kontrollera eventuella behov av specialfält eller mappning.
3. **Lägg till definitionen.** Skapa en mapp under Katla-paketet och registrera definitionen i den explicita listan. För standardfallet behövs ingen ny React-komponent eller endpoint.
4. **Ange driftvärden och katalogpost.** Använd den gemensamma driftmallen med Katla-id, adresser, namespace och sessionsinställningar. Ange åtkomstregel och publiceringsstatus i serverkonfigurationen som delas med ”Mina Katlor”. Hemligheter hanteras av befintlig driftlösning.
5. **Kör samma kontroller.** Verifiera konfiguration, schema, rendering, validering, sparning, återöppning och inskickning. Både mobil och desktop ska klara det gemensamma huvudflödet.
6. **Validera i testmiljö.** Skicka ett godkänt testärende och kontrollera uppgifter, parter, labels och åtkomst i Draken. Därefter kan instansen driftsättas genom samma releaseflöde som övriga Katlor.

### Utvecklarens verktyg

Följande kommandon är föreslagna och finns inte i dag. De utgör det arbetssätt som implementationen ska leverera.

| Kommando | Vad utvecklaren får |
| --- | --- |
| `yarn katla:new it-bestallning` | En liten startmall med definition, README och platser för testexempel. Definitionen registreras i den explicita listan. Utskriften visar vilka filer som skapades och vad som behöver fyllas i. |
| `yarn katla:check it-bestallning` | Kontroller av definition, registrering och relevanta lokala exempel. Visar vilka inställningar som faktiskt gäller, inklusive standardvärden, och vilka externa kontroller som ännu inte är gjorda. |
| `yarn katla:dev it-bestallning` | Start av befintlig frontend och backend med samma Katla vald. Visar lokal adress, vald Katla och målmiljö. Saknad miljökonfiguration ger ett riktat fel innan servrarna startas. |
| `yarn katla:check it-bestallning --connected` | Kontrollerar schemareferenser och relevant metadata mot vald testmiljö med tillgänglig behörighet. Detta är läsning; kommandot skapar inga ärenden. Verklig inloggning och mottagning verifieras separat. |
| `yarn katla:build it-bestallning` | Bygger med de befintliga byggverktygen för vald Katla och angiven målmiljö. En gemensam pipeline använder samma byggväg. |

Skapa-kommandot är ett litet repoägt skript med en standardmall. Det validerar id, skriver inte över befintliga filer och visar kvarvarande obligatoriska uppgifter. Det ska inte skapa React-sidor, endpoints, nya paket eller egna CI-filer per Katla. Ofullständiga exempel får aldrig presenteras som fungerande eller godkända.

Kontrollkommandot återanvänder definitionskontraktet och relevanta befintliga tester. Det skiljer mellan felaktig konfiguration, misslyckad anslutning och en kontroll som inte har körts. Ett godkänt lokalt resultat betyder inte att mottagningen i Draken är verifierad. Hemliga värden skrivs aldrig ut.

Fel ska ange Katla, fil eller miljöinställning, berört fält och nästa åtgärd. Exempel på avsedd feltext:

```text
Katla: it-bestallning
Fält: forms[0].schemaName
Fel: Schemanamn saknas i definitionen.
Åtgärd: Ange namnet på det publicerade schemat och kör kontrollen igen.
```

### Dokumentation och stöd i editorn

Root-README får en synlig länk med texten ”Skapa en ny Katla”. Den guiden är den enda startpunkten och innehåller snabbstarten först. Referensmaterial förklarar sedan valen för den som behöver ändra mer.

| Stöd | Krav |
| --- | --- |
| Förutsättningar | Skilj mellan gemensam lokal utvecklingsmiljö som ordnas en gång och uppgifter som behövs för varje Katla. Ange vem som ordnar scheman, namespace, inloggning och mottagning. |
| Ett komplett exempel | Visa en liten schema-Katla med representativa testuppgifter. Avvikelseflödet är referens för specialbehov och ska inte vara mallen man kopierar för standardfallet. |
| Fältbeskrivningar | Varje publikt konfigurationsfält har syfte, tillåtna värden, standardvärde och relevanta beroenden. Beskrivningarna ligger vid TypeScript-kontraktet så de kan visas i editorn. Guiden återger inte egna avvikande standardvärden. |
| Var ändringen hör hemma | Beskriv hur ett nytt formulärfält ändras i schema/UI-schema, hur ett vanligt appval ändras i definitionen och när en riktig verksamhetsregel kräver flödeskod. |
| Nästa steg | Kommandon och guide visar vägen från definition till lokalt fungerande app, ansluten testmiljö och verifierad mottagning. |
| Felsökning | Förklara de vanligaste felen: okänt Katla-id, schema saknas, metadata/status saknas, obehörig anslutning och fel sessions-/adressinställningar. |

Definitionen använder ett typat kontrakt med autokomplettering och begränsade val. Endast skillnader behöver anges; kontrollkommandot visar det fullständiga resultatet efter standardvärden. Ett nytt konfigurationsfält är inte klart förrän det har dokumentation, validering och ett meningsfullt beteendetest.

### Vad som räknas som enkelt

En utvecklare som inte byggt basen ska från en ren klon, med dokumenterade förutsättningar tillgängliga, kunna skapa en schema-Katla, se rätt formulär och verifiera inskickning utan muntliga instruktioner från den som byggt basen. Utvecklaren ska också kunna förklara var ett fält, ett appval och en verksamhetsregel ändras.

Detta provas innan arkitekturen betraktas som färdig. Notera tidsåtgång, felsteg och frågor under piloten. Separera aktivt applikationsarbete från väntan på namespace, behörigheter och schemaarbete. Ett bestämt löfte om antal minuter till en produktionsklar Katla ges först när det finns underlag.

Standardfallet ska ge en liten PR: definition, registrering, verksamhetsexempel och relevant dokumentation, samt instansens driftvärden där de förvaltas. Återkommande behov av ändringar i gemensamma komponenter eller av att kopiera hela flöden visar att gränserna behöver justeras.

## 8. Drift och byggmodell

Behåll Node-versionen och Yarn Classic 1.22.22 som projektets byggfiler använder. Lägg till workspaces, en privat rot och en gemensam låsfil. Frontend och backend fortsätter deklarera sina egna beroenden och relevanta kontroller. Dagens paketspecifika resolutions behöver sammanställas uttryckligen i roten så tidigare versionstvång bevaras. Yarn Classic stödjer en sådan struktur direkt. [Yarn Classic: Workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/)

En frontend byggs för valt Katla-id och rätt publika miljövärden. Backend startas med motsvarande Katla-id och instansens serverinställningar. Frontend- och backendartefakter samt konfiguration knyts till samma release i driften. Definitionsversionen kan härledas från definitionens innehåll vid byggnad. Ett automatiserat start-/smoketest jämför aktivt Katla-id och definitionsversion mellan frontend och backend och stoppar release om de inte stämmer överens.

Publika miljövärden i Next.js bakas in vid byggtid. Befintlig app använder dessutom `basePath`. Därför antar första införandet att frontend byggs för respektive målmiljö; enbart byte av miljövariabler på en färdig image räcker inte för alla värden. [Next.js: Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)

Workspaces påverkar dagens Dockerfiler och CI, som installerar och bygger från respektive paketmapp. Införandet behöver uppdatera byggkontext, installation, cache-nycklar, paketering av backendens delade beroende och Next.js sökvägar för byggrot/standalone. Den färdiga artefakten ska fungera utan tillgång till källrepot. [Next.js: Output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

Flera instanser på samma värd behöver konsekventa och separata sessionsnamn och cookie-sökvägar. Lagring i webbläsaren är gemensam per origin och måste därför också avgränsas med Katla-id. Dessa krav verifieras med två instanser samtidigt.

CI kör alla definitioners kontraktskontroller, gemensamma tester och nödvändiga tester per flöde. Varje lanserad Katla får ett huvudflödestest med sina representativa schema-/metadataexempel. Den befintliga RHEL-byggkontrollen behålls. Selektiv testning och byggcache optimeras först om körtiden kräver det.

### Containerimages och releaser

Första införandet använder två gemensamt underhållna Dockerfiler och en parameterstyrd byggpipeline. Antalet Katlor ska inte öka antalet Dockerfiler eller kopierade pipelines.

| Artefakt | Byggs för | Vad väljs vid start? |
| --- | --- | --- |
| Frontendimage | En Katla och en uppsättning publika byggvärden, initialt per målmiljö. | De serverinställningar som faktiskt stöder runtime. Katla-definition och `basePath` för bygget ändras inte vid start. |
| Backendimage | En kodrelease som innehåller de registrerade Katla-definitionerna. Samma image kan återanvändas av flera instanser och miljöer. | Katalogläge eller Katla-läge. Katla-läge kräver Katla-id, namespace och ärendeanslutningar. Båda lägena har relevant identitets- och åtkomstkonfiguration. |

Illustrativa imagenamn för startsidan och två Katlor på samma release:

```text
Mina Katlor, produktion:
  frontend: katla-web:katalog-prod-r42
  backend:  katla-api:r42  (katalogläge)

Katla avvikelse, produktion:
  frontend: katla-web:avvikelse-prod-r42
  backend:  katla-api:r42

Katla IT-beställning, produktion:
  frontend: katla-web:it-bestallning-prod-r42
  backend:  katla-api:r42
```

De två backendinstanserna kan använda samma image men kör med olika konfiguration och sessioner. De delar inte en körande backendprocess. Namnen ovan är exempel, inte befintliga publicerade images.

Varje driftsättning registrerar exakta image-digests och sin konfigurationsrevision. Releaseetiketten visar vilken kodversion bygget kommer från; digest binder driften till exakt imageinnehåll. Återställning väljer tidigare verifierat frontend-/backendpar och dess konfiguration. [Docker: Image digests](https://docs.docker.com/dhi/explore/security-concepts/digests/)

En ny Katla-definition kräver en frontendimage och en backendrelease som känner till definitionen. En kompatibel ny version av ett redan refererat schema eller UI-schema i schematjänsten kräver normalt ingen ny image. Ett nytt specialfält eller ändrad kod kräver däremot bygge. Schemapublicering och applikationsrelease är därför separata aktiveringar med sina egna kontroller.

Hemligheter tillförs vid drift och byggkontexten ska utesluta lokala miljöfiler med hemliga värden. Det gäller särskilt när byggkontexten flyttas till reporoten. En gemensam ändring verifieras för berörda Katlor, medan valet att uppgradera en viss instans görs i dess driftsättning.

En gemensam frontendimage för samtliga Katlor är ett möjligt senare steg. Det kräver att publika Katla-/miljövärden tillförs vid körning genom ett tydligt serverkontrakt, att alla stödda flöden och definitioner finns i releasen och att routningen använder en gemensam `basePath`. Separata värdnamn med appen på `/` kan förenkla det upplägget. Next.js kan läsa servervariabler vid körning, men `basePath` binds vid byggtid och kan inte bara bytas med en miljövariabel efteråt. [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Next.js: basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)

Om samma frontendimage måste kunna flyttas oförändrad från test till produktion är det ett driftkrav att ta med före implementationen. Då behöver konfigurations- och URL-modellen anpassas redan i första införandet. Annars följer planen det enklare införandet med frontendbyggen per Katla/målmiljö.

## 9. Införande i granskbara steg

Varje steg ska kunna granskas och återställas separat. Mekaniska flyttar hålls åtskilda från ändrade regler.

| Steg | Leverans | Villkor för klart |
| --- | --- | --- |
| 1. Lås nuläget och utvecklarens arbetsgång | Dokumentera dagens effektiva funktionsval och verksamhetskontrakt. Skriv första versionen av introduktionsguiden och standardmallen som mål för implementationen. Komplettera befintliga tester där skillnaderna mellan mobil och desktop saknar skydd. | Giltigt ärende, utkast, personkrav, platslabels och schemaidentitet har uttryckliga förväntningar. Skillnader som ska rättas är listade. Det är tydligt vilka filer och kommandon en ny utvecklare ska använda. |
| 2. Inför workspaces | Gemensam installation, låsfil och byggstöd. Börja med befintlig frontend och backend. | Samma applikation fungerar lokalt, i färdiga artefakter och i CI inklusive RHEL. Inga verksamhetsregler ändras i detta steg. |
| 3. Inför första definitionen | Lägg till definitionspaketet och registrera dagens avvikelse-Katla. Flytta appval och schemalista till rätt ägare. Inför kontrollkommandot tillsammans med kontraktets fältbeskrivningar. | Befintlig Katla får samma verifierade konfiguration. Okända val stoppas och frontend/backend använder samma definition. Utvecklaren kan se effektiva inställningar och få riktade fel. Ersatta miljöflaggor tas bort när driften har flyttats över. |
| 4. Samla verksamhetsflödet | Flytta avvikelsespecifika komponenter och regler. Samla validering, sparning och inskickning för mobil och desktop. | En regel har en ägare. Båda presentationerna använder samma slutkontroller och ärendemappning. Avsiktliga beteenderättningar har egna tester och diffar. |
| 5. Bevisa standardfallet | Inför schemaflödet och skapa-/startkommandona. Följ introduktionsguiden med nästa riktiga Katla. Om den saknas används en tydligt märkt testdefinition med annat schema utan avvikelsefält. | Registrering, utkast om aktiverat, återöppning och inskickning fungerar utan avvikelsernas parametrar. Gemensamma komponenter behöver inga kontroller av det nya Katla-id:t. Standardmallen har använts genom hela flödet. |
| 6. Validera introduktion och drift | Låt en annan utvecklare prova guiden. Färdigställ byggkommando, driftmall och kontroller för två samtidiga instanser. Ta bort ersatta dubbla kodvägar och oanvända produktionsfallbacks. | En utvecklare som inte gjort ombyggnaden kan införa en Katla med befintligt flöde genom att följa guiden. Dokumentation och kommandon har justerats efter försöket. Testmottagaren i Draken har verifierat resultatet före första nya produktionsinstansen. |
| 7. Inför gemensam startsida | Återanvänd identitet och gruppkontroll med en gemensam policykälla. Inför serverfiltrerad katalog, katalogläge och ”Mina Katlor”. Lägg till katalogmomentet i introduktionsstödet. | Noll/en/flera tilldelningar, direktlänkar, SSO, åtkomstförändringar och avgränsade portalendpoints uppfyller kriterierna i avsnitt 6a. |

Testdefinitionen i steg 5 är utvecklings-/testunderlag och ska inte bli en valbar produktions-Katla. En riktig verksamhets validering återstår alltid före dess lansering.

## 10. Acceptanskriterier och verifiering

- En ny Katla med befintligt flöde kräver definition, registrering, publicerade scheman, testexempel och driftvärden. Gemensam formulärkod och API-kod behöver inte ändras.
- Introduktionsguiden, standardmallen och kommandona har provats av en utvecklare som inte byggt basen. Ofullständiga eller okörda kontroller framgår tydligt; fel visar nästa åtgärd.
- ”Mina Katlor” visar rätt publicerade applikationer för den inloggade användaren och använder samma åtkomstregler som apparna. Befintliga direktlänkar fungerar med fortsatt serverkontroll.
- Avvikelse-Katlas godkända beteenden och ärendepayload bevaras. Medvetna rättningar går att granska separat.
- Både mobil och desktop stoppar samma ogiltiga inskickning och producerar samma verksamhetsuppgifter för samma indata.
- Gamla utkast öppnas med sparade schema-id:n även efter publicering av en ny version. Befintliga uppgifter försvinner inte vid byte av aktiv formulärlista.
- En schema-Katla fungerar utan avvikelsens rapporttyper, brukarregler och platsfält.
- Standardfält, felvisning och sammanfattning är användbara med tangentbord och på smal skärm för varje aktiverat flöde.
- Ogiltigt Katla-id, saknat schema, otillgänglig metadata och saknad schemaversion ger tydliga fel utan att felaktiga ärenden skickas in.
- Serversidans schema-, status- och åtkomstkontrakt är verifierat. En klient kan inte genom att ändra payload välja annan instans eller tilldela sig åtkomst via labels.
- Två Katlor på samma värd kan användas samtidigt utan att sessioner, wizardposition eller lokal lagring blandas ihop.
- Paketerade frontend- och backendartefakter fungerar fristående och kan återställas till föregående release.

Utöka befintliga beteendetester för ärendemappning, schemaidentitet, felhantering och formulärtillgänglighet. Använd genererade API-kontrakt där de redan är ägare. Undvik handskrivna kopior av deras DTO:er. Schema- och metadataexempel används i deterministiska tester; ett separat integrationstest i testmiljön verifierar den verkliga mottagningen.

Följande kommandon finns i dag och körs från respektive paketmapp vid implementation:

```sh
yarn lint:strict
yarn format:check
yarn type-check
yarn test
yarn build
```

Frontend kör dessutom `yarn e2e` efter byggnad med Playwright-miljön som dokumenteras i README/CI. Från reporoten körs `node .github/scripts/verify-node-runtime-contract.mjs`. Dessa kontroller anpassas till workspace-installationen; kontrakts- och flödestester för Katlor läggs till i samma CI.

Acceptans bevisas genom att återanvända ett litet antal meningsfulla scenarier för två skilda definitioner, kompletterat med avvikelsens verksamhetsfall. Tester som bara bekräftar mappnamn eller interna anrop räcker inte.

## 11. Risker, avgränsning och återställning

| Risk | Hantering och återställning |
| --- | --- |
| Oupptäckta avvikelseberoenden påverkar nästa Katla. | Testa en definition utan avvikelseparametrar genom hela användarflödet, inklusive översikt och sammanfattning. Flytta resterande regler till avvikelseägaren. |
| Dagens mobil-/desktopskillnader följer med i sammanslagningen. | Dokumentera skillnaderna, välj förväntat beteende och skydda det med beteendetester innan de separata vägarna tas bort. |
| Workspaces ändrar beroendeupplösning eller paketering. | Behåll verktygsversioner, granska resolutions och testa rena byggen samt fristående artefakter. Återställ workspace-steget eller driftsätt föregående artefaktpar. |
| Frontend, backend och driftkonfiguration avser olika Katlor. | Bind dem till en release, jämför id/definitionsversion automatiskt och verifiera sessionsinställningar. Återställ hela releasen tillsammans. |
| Nya scheman eller definitionsändringar gör gamla utkast oläsbara. | Bevara historiska schema-id:n och uppgifter. Granska ändringar av formulärlistan mot sparade exempel. Återställ aktivering/referenser, behåll publicerade historiska scheman. |
| Basen växer till en generell konfigurationsmotor. | Håll definitionen liten och lägg verkliga specialregler i ett namngivet flöde. Kräv en konkret konsument innan nya paket eller utökningspunkter införs. |

Första införandet omfattar gemensam struktur och ägarskap. Designbyte, byte av formulärbibliotek, byte av API-modell, datamigrering, omskrivning av Draken, adminverktyg för att skapa Katlor och dynamiskt Katla-byte i en körande instans ligger utanför planen. Statuskoder och befintlig latest-policy ändras först genom separata verksamhetsbeslut.

Föregående fungerande frontend, backend och driftskonfiguration ska finnas kvar som ett återställningsbart releasepar. Eftersom införandet bevarar ärendekontraktet och historiska scheman ska en återställning inte kräva omskrivning av ärenden. Detta verifieras med sparade utkast i testmiljön.

Den komplexitet som ska försvinna är dubbla validerings-/inskickningsvägar, spridda avvikelseantaganden och upprepade produktinställningar. En ny utvecklare ska kunna börja i Katla-definitionen, följa det valda flödet och sedan hitta den gemensamma formulär- och API-ägaren.

## 12. Beslut att validera

| Beslut | Rekommendation |
| --- | --- |
| Gemensam app eller separata kodbaser per Katla? | En gemensam frontend och backend, med definition per Katla. |
| Hur körs flera Katlor? | Separata instanser av den gemensamma koden, med självständigt styrda releaser. |
| Hur hittar användaren sina Katlor? | En gemensam inloggad startsida med serverfiltrerad katalog och SSO till respektive instans. |
| Var ägs scheman? | Fortsatt i JSON Schema-tjänsten; definitionen innehåller referenser. |
| Hur hanteras avvikelsens specialregler? | Ett tydligt avvikelseflöde. Nya rena schemaformulär använder standardflödet. |
| Vilken är första nya Katla? | Välj helst nästa riktiga verksamhet som pilot. En testdefinition används tills ett konkret pilotfall finns. |

Därutöver behöver pilotens mottagning, åtkomst, metadata och stöd för `DRAFT`/`NEW`/`SOLVED` bekräftas. Om pilotens behov avviker justeras den relevanta gränsen innan implementationen utökas.
