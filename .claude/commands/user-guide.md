---
description: Uppdatera användarguiden (/hjalp) efter en ändring i rapporteringsflödet
---

Se till att användarguiden "Så rapporterar du en avvikelse" stämmer med appen efter den aktuella ändringen. Kraven och detaljerna står i `AGENTS.md` i repots rot. Läs den först.

## 1. Kartlägg påverkan

- Jämför grenen med `main` (`git diff main...HEAD` och osparade ändringar) och lista allt som påverkar vad en användare ser eller gör när hen rapporterar: sidor, avsnitt, fält, knappar, etiketter, validering, dialoger, kvitto, mobilens steg, avvikelseschemat och funktionsflaggor.
- Jämför med guidens steg i `frontend/src/components/user-guide/user-guide-steps.ts` och texterna i `frontend/locales/sv/user-guide.json`. Notera vad som är inaktuellt och vad som saknas helt, till exempel en ny funktion som behöver ett eget steg eller avsnitt.

## 2. Uppdatera

- Generatorns flöde och mockad data: `frontend/e2e/tests/user-guide.spec.ts`, `frontend/e2e/fixtures/mockUserGuide.ts`.
- Kontraktet för bilder och pilar: `frontend/src/components/user-guide/user-guide-screenshots.ts`.
- Steg, bilder och pilar: `frontend/src/components/user-guide/user-guide-steps.ts`.
- Texter på svenska och engelska. Knappnamn som texterna nämner läggs till i `user-guide-ui-labels.ts` och skrivs aldrig in som fast text.

## 3. Generera och granska

- Starta dev-servern i `frontend` med `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true` om den inte redan kör. Kör sedan `yarn generate:user-guide`.
- Titta på varje ändrad bild i `frontend/public/user-guide/` och på sidan `/hjalp`, både på bred skärm och i mobilbredd. Varje pil ska träffa rätt element, ingen siffra får täcka viktig text, och texten ska beskriva det bilden visar. Justera `placement` eller `distance` och generera om vid behov.

## 4. Verifiera

Kör i `frontend`:

- `yarn test`
- `yarn e2e user-guide registrera header-accessibility`
- `yarn lint:strict`
- `yarn format:check`
- `yarn type-check`

## 5. Rapportera

Sammanfatta vilka steg, bilder och texter som ändrades och varför. Ange också allt du inte kunde verifiera. Bilderna, manifestet, stegen och texterna ska committas tillsammans med flödesändringen.
