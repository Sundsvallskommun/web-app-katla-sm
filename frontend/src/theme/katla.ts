import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

/** Katlas profil. Komponentmått, kontrastskalor och tillstånd ägs av Astryx neutral. */
export const katlaTheme = defineTheme({
  name: 'katla',
  extends: neutralTheme,
  color: { accent: ['#087e80', '#64d8cd'], neutralStyle: 'neutral', contrast: 'high' },
  typography: {
    body: { family: 'system-ui', fallbacks: 'Arial, sans-serif' },
    heading: { family: 'system-ui', fallbacks: 'Arial, sans-serif' },
  },
});
