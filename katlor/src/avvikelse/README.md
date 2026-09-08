# Avvikelse

Befintlig Katla för avvikelser och missförhållanden. Verksamhetsägare och aktuellt namespace anges i driftens dokumentation.

Schema: `avvikelse-plats-handelse`, publicerat i JSON Schema-tjänsten. Historiska `schemaId` används oförändrat för sparade ärenden. Referensexempel och API-svar finns i frontendens och backendens testunderlag; lokala schemafiler används inte som produktionsfallback.

Definitionen bevarar tidigare `.env-example`: utkast av, ärendefilter på, kompakta partsuppgifter på, markering av klara sektioner av och övriga parter av. Ärendegrunden är `Empty errand`, `MEDIUM`, `ESERVICE`, `INFORMED`. Dessa är kodens dokumenterade utgångsvärden; jämför den faktiska driften innan övergång. En drift som använt andra produktflaggor behöver få sitt avsedda val uttryckligt i definitionen före bygge.

Avvikelsens regler ägs av `frontend/src/flows/avvikelse` och de gemensamt validerade platslabel-reglerna i `katlor/src/avvikelse-rules.ts`. `avvikelse-test` provar utkast och de utökade partsuppgifterna utan att ändra produktionsdefinitionen.
