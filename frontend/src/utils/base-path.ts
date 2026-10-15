/**
 * Prefixar en appintern sökväg med bassökvägen, till exempel '/sw.js' → '/vof/sw.js'.
 *
 * Next lägger själv till bassökvägen på länkar och sina egna resurser, men inte i
 * manifestets adresser eller när service workern registreras. Variabeln läses vid anropet
 * så att tester kan byta värde; i bygget ersätter Next den ändå med ett fast värde.
 */
export const withBasePath = (path: string): string => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
