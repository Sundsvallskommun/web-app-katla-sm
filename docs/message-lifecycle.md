# Meddelanden: ansvar och införande

Rapportörens samtal är `INTERNAL` och saknar `relationIds`. Katlas samtalscontroller kontrollerar samma villkor före läsning av meddelanden, skickande, läskvitton och bilagehämtning. SupportManagement äger behörigheten till själva ärendet och beständig lagring av samtal.

## Atomärt skapande

SupportManagement måste skapa eller återanvända ett internt samtal utan relationskoppling under ärendets databaslås. Kontrollen och skapandet ligger i en transaktion. Katlas backend anropar `PUT .../communication/conversations/internal` och använder det returnerade samtals-ID:t. Endpointen accepterar enbart interna samtal utan relationskoppling. Saknas endpointen avvisas anropet; Katla faller inte tillbaka till ett osäkert skapande. En kontroll i Katlas process kan inte samordna andra instanser eller handläggarens app.

Den tillhörande API-ändringen finns på branchen `fix/reporter-conversation-creation` i `api-service-support-management`. Den använder befintliga `AccessControlService.getErrand(..., true, ..., RW)` och `ConversationService.createConversation`, med `READ_COMMITTED`. Om flera sådana samtal redan finns återanvänds det med lägst ID. Historik raderas inte; Katlas vy läser alla rapportörssamtal och behåller varje meddelandes samtals-ID för läskvitton och bilagor.

API:ts OpenAPI-schema använder namnet `ConversationIdentifier` för samtalens identiteter, så att de inte kolliderar med abonnentmodellens `Identifier`. JSON-fälten förblir desamma.

## Sidindelning och uppdatering

`GET /supportmanagement/errand/:errandId/conversations/:conversationId/messages?page=0` returnerar `ConversationMessagesPageDTO` med `messages`, `page` och `hasMore`. Backend begär 50 poster och stabil sortering på `created DESC, id DESC`. Systemhändelser filtreras efter hämtning; även en tom synlig sida kan därför ha `hasMore: true`. Ett ofullständigt eller felaktigt sidsvar ger 502, inte en falskt tom historik.

Hooken `useConversationMessages` äger hämtningar och läskvitton. Användaren kan hämta äldre meddelanden och uppdatera manuellt. Historiken uppdateras också vid fokus, återanslutning, återgång till synlig sida och var 30:e sekund när sidan är synlig. Vid uppdatering hämtas de redan öppnade sidorna igen eftersom nya meddelanden flyttar sidgränserna. Dubbletter identifieras med både samtals-ID och meddelande-ID.

Hämtningar överlappar inte. Ett eget skickande köar en ny uppdatering om en hämtning redan pågår. Byte av ärende och avmontering avbryter klientanropen och avvisar sena svar. Misslyckad uppdatering behåller tidigare historik med ett felmeddelande. Bara lyckade läskvitton spärrar nya försök; misslyckade kvitton provas vid nästa uppdatering. Dolda sidor skickar inte nya läskvitton.

Formulärets textredigerare, verktygsfält och bilagekontroller låses under skickandet. Ett lyckat skickande tömmer formuläret. Vid fel bevaras text och bilagor och formuläret låses upp.

## Införande och återställning

1. Inför API-ändringen i SupportManagement bakom den gatewayadress som `getApiBase('supportmanagement')` pekar på. Kontrollera att samtliga instanser använder ändringen innan Katla uppdateras. Katla pekar för närvarande på aliaset `supportmanagement-sprint/15.1`; API-repots versionsnummer ersätter inte automatiskt gatewaykonfigurationen.
2. Inför Katlas backend och frontend tillsammans. Svarskontraktet för meddelanden har ändrats från en array till en sida; äldre klienter behöver ladda om sidan efter införandet.
3. Verifiera i testmiljön att samtidig start från rapportör och handläggare återanvänder samma samtal och att båda kan läsa och svara med bilagor.

Ingen databasmigrering eller radering behövs. Vid återställning återställs Katlas frontend och backend tillsammans. API-fixen kan ligga kvar med den äldre Katla-versionen. Återställ inte API-fixen medan den nya Katla-versionen fortfarande används: skickandet avvisas då tills API-fixen återinförs.

## Validering

I både `backend` och `frontend`: `yarn test`, `yarn type-check`, `yarn lint:strict` och `yarn format:check`.

Webbläsartester: `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn e2e meddelanden.spec.ts`.

I API-repot: `mvn -Dtest=ConversationServiceTest,ConversationCreationPersistenceTest,ErrandCommunicationResourceTest test`. Persistenstesterna använder MariaDB via Testcontainers och verifierar samtidiga transaktioner samt återförsök efter återställd transaktion. OpenAPI-kontraktet verifieras med `mvn test-compile failsafe:integration-test failsafe:verify -Dit.test=OpenApiSpecificationIT`.
