/**
 * Id:n för de avsnitt som valideras utan att gå genom schemaformuläret. Både felsammanfattningen
 * och avsnittet självt använder dem: sammanfattningen för att länka dit, avsnittet för att märka
 * ut sig och visa sitt meddelande.
 *
 * Egen fil eftersom komponentfiler bara får exportera komponenter (react-refresh).
 */

/** Listan över kollegan man rapporterar åt, i rapportörens avsnitt. */
export const COLLEAGUE_FIELD_ID = 'reporter-colleague';

/** Listan över den enskilda brukaren rapporten berör. */
export const USER_FIELD_ID = 'errand-user';

/** Platsen ligger i schemaformuläret och bär därför RJSF:s id för fältet. */
export const FACILITY_FIELD_ID = 'root_facilityInfo';
