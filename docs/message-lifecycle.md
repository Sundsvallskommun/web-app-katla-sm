# Meddelanden: ansvar och införande

Rapportörens samtal är `INTERNAL` och saknar `relationIds`. Katlas samtalscontroller kontrollerar samma villkor före läsning av meddelanden, skickande, läskvitton och bilagehämtning. SupportManagement äger behörigheten till själva ärendet och beständig lagring av samtal.

## Skapande med befintligt API

Katlas samtalscontroller läser först befintliga samtal och återanvänder det första interna samtalet utan relationskoppling. Om inget finns skapar den ett via befintliga `POST .../communication/conversations`. `ApiService` följer API:ts `Location`-header för att läsa det skapade samtalet. Misslyckad läsning av befintliga samtal avbryter skapandet.

Ändringen kräver inga nya endpointar eller ändringar i SupportManagement. Katlas urval av rapportörssamtal är en regel i Katla och inför ingen begränsning av hur många interna samtal andra API-konsumenter får skapa eller vilka ämnen och deltagare de får ha.

GET och POST är separata operationer. Om två klienter samtidigt ser en tom lista kan båda skapa ett samtal. Katla garanterar därför inte ett enda samtal vid samtidig start. Vyn läser alla rapportörssamtal och behåller varje meddelandes samtals-ID för läskvitton och bilagor, så att flera samtal inte döljer historik i Katla. En global garanti mot dubbelt skapande kräver ett separat kontraktsbeslut med API-ägarna och hänsyn till samtliga konsumenter. Ingen sådan garanti påstås här.

## Sidindelning och uppdatering

`GET /supportmanagement/errand/:errandId/conversations/:conversationId/messages?page=0` returnerar `ConversationMessagesPageDTO` med `messages`, `page` och `hasMore`. Backend begär 50 poster och stabil sortering på `created DESC, id DESC`. Systemhändelser filtreras efter hämtning; även en tom synlig sida kan därför ha `hasMore: true`. Ett ofullständigt eller felaktigt sidsvar ger 502, inte en falskt tom historik.

Hooken `useConversationMessages` äger hämtningar och läskvitton. Användaren kan hämta äldre meddelanden och uppdatera manuellt. Historiken uppdateras också vid fokus, återanslutning, återgång till synlig sida och var 30:e sekund när sidan är synlig. Vid uppdatering hämtas de redan öppnade sidorna igen eftersom nya meddelanden flyttar sidgränserna. Dubbletter identifieras med både samtals-ID och meddelande-ID.

Hämtningar överlappar inte. Ett eget skickande köar en ny uppdatering om en hämtning redan pågår. Byte av ärende och avmontering avbryter klientanropen och avvisar sena svar. Misslyckad uppdatering behåller tidigare historik med ett felmeddelande. Bara lyckade läskvitton spärrar nya försök; misslyckade kvitton provas vid nästa uppdatering. Dolda sidor skickar inte nya läskvitton.

Formulärets textredigerare, verktygsfält och bilagekontroller låses under skickandet. Ett lyckat skickande tömmer formuläret. Vid fel bevaras text och bilagor och formuläret låses upp.

## Införande och återställning

1. Inför Katlas backend och frontend tillsammans. Svarskontraktet mellan dem för meddelanden har ändrats från en array till en sida; äldre klienter behöver ladda om sidan efter införandet. SupportManagement använder sitt befintliga kontrakt.
2. Verifiera i testmiljön att rapportör och handläggare kan läsa och svara med bilagor och att Katla visar historiken även om ärendet har flera rapportörssamtal.

Ingen databasmigrering eller radering behövs. Vid återställning återställs Katlas frontend och backend tillsammans.

## Validering

I både `backend` och `frontend`: `yarn test`, `yarn type-check`, `yarn lint:strict` och `yarn format:check`.

Webbläsartester: `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn e2e meddelanden.spec.ts`.
