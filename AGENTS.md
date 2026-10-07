# AGENTS.md

Instruktioner för AI-agenter (Claude Code, Codex, Copilot m.fl.) och utvecklare som arbetar i repot. Allmänna konventioner, kommandon och arkitektur står i [CLAUDE.md](CLAUDE.md). Den här filen gäller **användarguiden**: hur en användare rapporterar en avvikelse.

## Regeln

**Användarguiden ska alltid beskriva appen så som den ser ut och fungerar just nu.** Varje ändring som påverkar vad en användare ser eller gör när hen rapporterar ska uppdatera guiden i samma ändring (samma PR). En ändring som gör guiden inaktuell är inte klar, även om koden och testerna i övrigt är det.

Uppdatera guiden när du:

- ändrar registreringsflödet: sidor, avsnitt, fält, val, ordning, validering, felsammanfattning, bekräftelsedialog, kvitto eller mobilens stegvisa formulär
- byter namn på eller flyttar en knapp, rubrik eller länk som guiden pekar ut
- ändrar avvikelseschemat (`backend/src/local-schemas/` eller schemat i JSON Schema-tjänsten), till exempel nya frågor eller nya obligatoriska fält
- slår på, slår av eller lägger till en funktionsflagga som ändrar flödet (`frontend/src/config/appconfig.tsx`)
- lägger till en ny funktion som användaren behöver kunna använda, till exempel utkast, meddelanden eller bilagor. Lägg då till ett nytt steg, ett nytt avsnitt eller en ny guide. Skriv inte bara om en befintlig text.

Är du osäker på om en ändring påverkar guiden: öppna `/hjalp` och läs den som en ny användare.

## Krav på guiden

- **Egen sida som nås från hela appen.** Guiden ligger på `/hjalp` och nås via **Hjälp** i sidhuvudet på alla sidor (`AppHeader`, och den mobila översiktens sidhuvud). Från sidor med ett osparat formulär öppnas guiden i en ny flik, så att det ifyllda inte försvinner. Nya sidhuvuden ska också ha hjälplänken (`HelpLink`).
- **Pedagogisk.** Skriv klarspråk med du-tilltal. Ett steg motsvarar en sak användaren gör, och stegen står i flödets ordning. Förklara varför där det hjälper, till exempel att platsen styr vem som ser rapporten.
- **Bilder med pilar.** Varje steg som kräver en handling visar en skärmbild med numrerade pilar mot det man ska klicka på eller fylla i. Samma nummer står i en lista under bilden.
- **Texten bär hela instruktionen.** Bilden visar var, men listan under bilden ska räcka för den som inte ser bilden. Varje bild har en alt-text.
- **Automatiska bilder.** Skärmbilderna och pilarnas lägen genereras från det riktiga flödet med Playwright. Redigera aldrig bilderna för hand och rita aldrig pilar i bildfilerna.
- **Samma ord som skärmen.** Knapp- och rubriknamn i texterna hämtas ur appens översättningar som `{{etikett}}` (`user-guide-ui-labels.ts`) och skrivs aldrig in som fast text. Undantaget är etiketter som bara finns i avvikelseschemat, till exempel "Enhet eller avdelning".
- **Påhittade uppgifter.** Allt i bilderna ska vara fiktivt: Skatteverkets testpersonnummer, PTS testtelefonnummer och e-postadresser under `example.com` (`e2e/fixtures/mockUserGuide.ts`). Använd aldrig riktiga personer eller riktiga ärenden.
- **Båda språken.** Texterna finns i `frontend/locales/sv/user-guide.json` och `frontend/locales/en/user-guide.json` med samma nycklar. Bilderna visar den svenska versionen.

## Så uppdaterar du guiden

Alla sökvägar nedan är relativa till `frontend/`.

1. **Flödet.** Gå igenom ändringen i generatorn `e2e/tests/user-guide.spec.ts`, som klickar sig igenom registreringen som en användare. Lägg till eller ändra steg och mockad data där (`e2e/fixtures/mockUserGuide.ts`).
2. **Bilderna.** Varje bild och varje element som en pil får peka på står i kontraktet `src/components/user-guide/user-guide-screenshots.ts`. En ny bild eller pil läggs till där först. Därefter tvingar TypeScript fram en mätning i generatorn och tillåter pilen i stegen.
3. **Stegen.** Ordning, bilder och pilar (`placement`, vid behov `distance`) står i `src/components/user-guide/user-guide-steps.ts`. Ett steg som bara gäller med en viss funktionsflagga får `feature`.
4. **Texterna.** Skriv texterna i båda språkfilerna. Behöver en text ett nytt knappnamn, lägg till det i `src/components/user-guide/user-guide-ui-labels.ts`.
5. **Generera.** Starta dev-servern (se nedan) och kör:

   ```bash
   yarn generate:user-guide
   ```

   Kommandot skriver bilderna till `public/user-guide/` (filnamnen innehåller en hash av innehållet, så att ingen cache visar en gammal bild med nya pilar) och manifestet med elementens lägen till `src/components/user-guide/generated/user-guide-manifest.json`. Gamla bilder tas bort.
6. **Granska.** Öppna `/hjalp`, dels på bred skärm, dels i mobilbredd. Kontrollera att varje pil träffar rätt element och att ingen siffra täcker viktig text. Justera annars `placement` eller `distance` och generera om. Kontrollera även att texterna stämmer med bilderna.
7. **Verifiera.**

   ```bash
   yarn test
   yarn e2e user-guide registrera header-accessibility
   yarn lint:strict
   yarn format:check
   yarn type-check
   ```

8. **Committa** bilderna, manifestet, stegen och texterna tillsammans med ändringen av flödet.

Dev-servern ska köras med samma funktionsflaggor som Playwright kräver (`NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true`, `NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false`). Funktionsflaggorna styr vad som syns i bilderna. Generera därför med de flaggor som gäller i produktion. Bilderna ska vara tagna i ljust läge och på svenska, vilket generatorn redan ser till.

## Hur delarna hänger ihop

| Del | Fil | Ansvar |
| --- | --- | --- |
| Kontrakt | `src/components/user-guide/user-guide-screenshots.ts` | Vilka bilder som finns och vilka element pilarna får peka på |
| Generator | `e2e/tests/user-guide.spec.ts`, `e2e/utils/user-guide-recorder.ts` | Går igenom flödet, tar bilderna och mäter elementen |
| Manifest | `src/components/user-guide/generated/user-guide-manifest.json` | Genererat. Bildernas storlek och elementens lägen. Redigeras inte för hand |
| Bilder | `public/user-guide/*.webp` | Genererade. Redigeras inte för hand |
| Steg | `src/components/user-guide/user-guide-steps.ts` | Guidens innehåll och ordning |
| Etiketter | `src/components/user-guide/user-guide-ui-labels.ts` | Knapp- och rubriknamn ur appens översättningar |
| Texter | `locales/{sv,en}/user-guide.json` | Guidens texter |
| Sida | `src/app/[locale]/hjalp/`, `src/components/user-guide/` | Sidan, bilderna med pilar och hjälplänken |

## Det som testerna fångar och inte fångar

- **E2e (`user-guide.spec.ts`) i CI** går igenom flödet utan att skriva några filer. Testet faller om ett element som guiden pekar ut försvinner eller inte längre syns.
- **Enhetstestet (`tests/unit/components/user-guide/user-guide-content.test.ts`)** faller om manifestet saknar en bild eller ett element, om bildfilerna inte stämmer med manifestet, om en text saknas eller om en text hänvisar till en etikett som inte finns.
- **Språktestet (`tests/unit/app/locales.test.ts`)** faller om svenska och engelska inte har samma nycklar.

Inget test märker att en **ny** funktion saknas i guiden, eller att en bild visar något annat än texten säger. Det ansvaret ligger på den som gör ändringen, och därför finns regeln överst i den här filen.
