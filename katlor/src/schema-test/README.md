# Schema-Katla (test)

Uttrycklig testdefinition som bevisar standardflödet med rubrik och beskrivning. Den innehåller inga rapporttyper, brukare eller avvikelseplatser. `example.json` är representativ lokal schema-/UI-schema-/datatestdata, inte ett publicerat verksamhetsschema.

Kör `yarn katla:check schema-test --test` från roten. `yarn katla:dev schema-test --test` kräver en faktisk lokal/testanslutning och att schemanamnet publicerats där; kommandot inför ingen lokal schemafallback. Den deterministiska webbläsarverifieringen körs med `yarn workspace katla-web-app playwright test --config playwright.schema.config.ts` och en avgränsad testserver.

Testdefinitioner kräver explicit tillåtelse och får aldrig publiceras i katalogen. En riktig verksamhetspilot återstår.
