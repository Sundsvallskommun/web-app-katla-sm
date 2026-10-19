/** Ärendets grundinformation: själva rapporten, och där ett utkast fortsätter att fyllas i. */
export const errandBasicInformationPath = (errandNumber: string | undefined): string =>
  `/arende/${errandNumber ?? ''}/grundinformation`;

/**
 * Ärendets meddelanden. Ett ärende öppnas här, både från översikten och från notiserna: när rapporten
 * väl är inskickad är det i samtalet med handläggaren som det händer något.
 */
export const errandMessagesPath = (errandNumber: string | undefined): string =>
  `/arende/${errandNumber ?? ''}/meddelanden`;
