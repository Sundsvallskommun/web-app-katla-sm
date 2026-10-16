/**
 * Partens externalId är ett partyId, och typen säger vems: en privatperson ur Citizen eller en
 * anställd ur Employee. Typen sätts där parten slås upp, eftersom bara uppslaget vet vilket register
 * personen hittades i. Brukare och andra privatpersoner som söks på personnummer är PRIVATE;
 * anställda är EMPLOYEE, oavsett om de söks på användarnamn eller personnummer.
 */
export const EXTERNAL_ID_TYPE_PRIVATE = 'PRIVATE';
export const EXTERNAL_ID_TYPE_EMPLOYEE = 'EMPLOYEE';
