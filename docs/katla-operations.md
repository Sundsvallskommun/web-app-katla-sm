# Drift, images och återställning

## Två Dockerfiler, flera instanser

Alla byggen använder reporoten som kontext. Backendimagen innehåller den registrerade definitionsuppsättningen och kan återanvändas av alla Katlor och katalogen på samma release. Frontend byggs för vald instans och målmiljö eftersom Next bygger in publika värden och `basePath`.

```sh
docker build -f backend/Dockerfile -t katla-api:local-review .
docker build -f frontend/Dockerfile -t katla-web:avvikelse-local-review \
  --build-arg APP_MODE=katla --build-arg KATLA_ID=avvikelse \
  --build-arg NEXT_PUBLIC_API_URL=https://avvikelse.example.invalid/api \
  --build-arg NEXT_PUBLIC_SESSION_COOKIE_NAME=katla.avvikelse.sid \
  --build-arg NEXT_PUBLIC_CATALOGUE_URL=https://katla.example.invalid .
docker build -f frontend/Dockerfile -t katla-web:catalogue-local-review \
  --build-arg APP_MODE=catalogue \
  --build-arg NEXT_PUBLIC_API_URL=https://katla.example.invalid/api \
  --build-arg NEXT_PUBLIC_SESSION_COOKIE_NAME=katla.catalogue.sid .
```

Dockerfilen exponerar ingen testflagga för produktionsfrontend. Testdefinitionernas byggen körs uttryckligen av browser-CI med `TEST=true`. Backend avvisar `ALLOW_TEST_KATLA=true` i produktionsläge. Produktnamn och funktionsflaggor är definitionsdata, inte byggargument längre.

`docker-compose.yml` använder samma Dockerfiler. `BACKEND_ENV_FILE` pekar på en skyddad envfil och `KATLA_CONFIG_DIR` på en katalog som innehåller `catalogue.json`. Montera hela konfigurationskatalogen som read-only så en atomisk ersättning av filen blir synlig för körande processer. Den lokala overridefilen publicerar portarna 3000/3001; välj egna portar och Compose-projektnamn för samtidiga instanser. Drift använder bara grundfilen och organisationens routing/TLS.

Rotens `.dockerignore` utesluter lokala miljöfiler, certifikat, nycklar, sessionsexporter, byggen och `node_modules`. Hemligheter tillförs vid runtime; publika URL:er tillförs vid frontendbygget. `ADMIN_URL` och health-auth är servervärden som kan tillföras när frontendprocessen startar.

## En gemensam serverpolicy

Identitetsplattformen äger medlemskap. Drift distribuerar en validerad policyrevision till samtliga instanser. Servern läser aktuell policy vid skyddade anrop och nekar åtkomst om filen blir ogiltig eller saknas. Validera en ny fil innan den byts atomiskt; behåll föregående verifierade fil för återställning.

`published` styr portalens lista, medan `allowedGroups` även kontrolleras vid direktanrop. Att dölja en app återkallar alltså inte gruppens åtkomst. För återkallelse ändras gruppregeln. Gruppuppgifter i sessionen blir inte automatiskt nya när medlemskap ändras i IdP; `sessionMaxAgeSeconds` begränsar hur länge gamla claims godtas. Verksamheten behöver besluta om gränsen och eventuellt ytterligare återkallelsekrav.

Portalens backend saknar ärende-, schema- och personendpoints och behöver inga klienthemligheter för dessa API:er. Varje Katla har eget namespace/kommun i serverkonfigurationen. Klientens payload väljer aldrig instans eller namespace. Ärendetillgång avgränsas separat från appåtkomst till den verifierade rapportörsanvändaren.

Varje instans har eget cookie-namn (`katla.<id>.sid`/`katla.catalogue.sid`), cookie-path och sessionsutrymme. Två instanser på samma host ska ha disjunkta app-/API-sökvägar eller separata värdnamn. `NEXT_PUBLIC_SESSION_COOKIE_NAME` måste matcha servern. Lokal utloggning ska inte beskrivas som att alla Katla- och IdP-sessioner avslutas.

## Release och verifiering

Registrera kodrevision, frontend- och backendimage-digests, Katla-id/definitionsrevision samt konfigurations- och policyrevision för varje driftsättning. Ett imagenamn är inte tillräckligt för återställning. En ny definition behöver en backendrelease som innehåller den.

`yarn katla:check <id> --connected ...` jämför målbackendens `/app-context` med checkoutens id och definitionsrevision. Frontend kontrollerar också sitt inbyggda id/revision mot samma endpoint före användning och blockerar ett felaktigt par. `yarn standalone:check` flyttar frontendartefakten till en temporär katalog utanför källrepot, verifierar paketerade beroenden och definitionsrevision, provar Sharp/AVIF/WebP och startar login-routen. Backend paketeras med `node scripts/backend-artifact.mjs` utan sökvägsargument i `katla-backend-artifact` under operativsystemets temporära katalog (Linux: `/tmp/katla-backend-artifact`). Befintlig katalog skrivs aldrig över; ta bort den föregående temporära artefakten uttryckligen före en ny lokal paketering. Artefakten får en ren produktionsinstallation och startas av `node scripts/backend-smoke.mjs` (också utan argument) utanför repot utan ärende-API-hemligheter.

GitHub CI kör definitions-/CLI-kontrakt, lint, format, typer och båda applikationernas enhetstester. Avvikelse-test, schema-test och katalog har separata frontendbyggen, fristående kontroll och Playwrightscenarier. Samma Dockerfiler byggs utan publicering. RHEL-jobbet kör arbetsytans installation, båda byggena och artefaktkontroller i UBI 8.10 med pinnad Node 22.18.0 och Yarn 1.22.22.

Lokala artefakt-/browserprov verifierar implementationen med testdata. Följande måste utföras mot verklig testmiljö före lansering:

- Verifiera IdP-attribut, riktig SAML-inloggning, direktlänkar, SSO mellan separata instanser, lokal utloggning och gruppändring/claims-ålder.
- Låt SupportManagement-ägaren verifiera `reporterUserId`-filter inklusive paginering, `X-Sent-By`, versionskontroll vid PATCH och verksamhetens metadata/labels.
- Skapa ett representativt ärende och kontrollera uppgifterna i Draken. Prova utkast, återöppning, inskickning, meddelanden och bilagor där de ingår.
- Återöppna ett verkligt gammalt utkast efter publicering av ett nytt schema och vid återställning till föregående apprelease. Alla historiska schema-id:n måste vara tillgängliga.
- Prova två riktiga instanser samtidigt och kontrollera att session, wizardposition och sortering hålls isär.
- Låt en annan utvecklare följa introduktionsguiden och dokumentera eventuella hinder.

## Övergång och återställning

Inventera driftens faktiska produktflaggor innan övergång. Avvikelsedefinitionen bevarar den tidigare exempelkonfigurationen; miljöer som haft andra effektiva val behöver ett uttryckligt beslut om sin definition. Ta sedan bort `NEXT_PUBLIC_APP_NAME` och de tidigare `NEXT_PUBLIC_DRAFT_ERRAND`, `NEXT_PUBLIC_ERRAND_FILTER`, `NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO`, `NEXT_PUBLIC_DISCLOSURE_DONE_MARK`, `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE` från produktkonfigurationen. Ersätt `AUTHORIZED_GROUPS` med katalogpolicyn. Flytta installation till roten och radera inga sparade ärenden eller schema-id:n.

Återställ ett helt verifierat frontend-/backendpar tillsammans med dess instanskonfiguration och policyrevision. Behåll äldre publicerade scheman. Byte av sessionshemlighet eller instansidentitet gör tidigare sessioner ogiltiga och kräver ny inloggning; detta är inte en datamigrering. Verifiera återställning med testutkast innan en ny verksamhet går i produktion.

Åtkomstpolicy kan behöva återställas separat från kod vid ett driftfel. Kontrollera då att ingen avsiktlig återkallelse återställs av misstag. Policyuppdatering och releaseaktivering ska vara granskade, spårbara driftåtgärder.

## Interna och externa Katlor

Detta införande omfattar interna Katlor med den befintliga SAML-identiteten och gruppbaserad appåtkomst. En framtida extern Katla kan dela repo, design, schemaformulär och transportkod, men behöver en egen verifierad inloggnings- och behörighetsmodell, exempelvis för medborgare och ombud. Separata interna och externa instanser ska ha egna sessioner, anslutningsbehörigheter och driftvärden. Olika inloggningsflöden kräver inte i sig separata repon; eventuell uppdelning avgörs av förvaltnings- och säkerhetskrav. Extern autentisering ingår inte i denna implementation.
