/**
 * Skärmbilderna i användarguiden och de element i varje bild som guiden pekar ut med pilar.
 *
 * Listan är kontraktet mellan generatorn (e2e/tests/user-guide.spec.ts), som går igenom det
 * riktiga flödet, tar bilderna och mäter var elementen ligger, och guiden, som ritar pilarna.
 * Båda sidor typkontrolleras mot listan: generatorn måste mäta varje element som står här, och
 * guiden kan inte peka på något som generatorn inte mäter.
 *
 * Egen fil utan React-beroenden, eftersom Playwright-generatorn importerar den.
 */
export const USER_GUIDE_SCREENSHOTS = {
  overview: ['new-report-button'],
  reporter: ['reporter-card', 'colleague-checkbox'],
  about: ['event-type', 'event-concerns'],
  user: ['person-search', 'add-person', 'add-manually'],
  'other-parties': ['search-type', 'party-search'],
  'deviation-place': ['facility'],
  'deviation-time': ['event-date', 'occurred-date'],
  'deviation-description': ['event-description', 'actions-taken'],
  submit: ['cancel-button', 'submit-button'],
  'error-summary': ['summary', 'summary-link'],
  confirm: ['confirm-button'],
  submitted: ['receipt', 'back-to-overview'],
  'mobile-step': ['step-indicator', 'next-button'],
  'mobile-summary': ['summary', 'submit-button'],
} as const satisfies Record<string, readonly string[]>;

export type UserGuideScreenshotId = keyof typeof USER_GUIDE_SCREENSHOTS;

export type UserGuideTargetId<Screenshot extends UserGuideScreenshotId> =
  (typeof USER_GUIDE_SCREENSHOTS)[Screenshot][number];

/** En rektangel i skärmbildens egna CSS-pixlar, räknat från bildens övre vänstra hörn. */
export interface ScreenshotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserGuideScreenshot {
  /** Filnamnet under public/user-guide/. */
  file: string;
  /** Bildens storlek i CSS-pixlar. Själva filen är tagen med högre upplösning. */
  width: number;
  height: number;
  targets: Record<string, ScreenshotRect>;
}

/** Det generatorn skriver till generated/user-guide-manifest.json. */
export interface UserGuideManifest {
  /** Datumet då bilderna togs, ÅÅÅÅ-MM-DD. Visas i guiden. */
  generatedAt: string;
  screenshots: Record<string, UserGuideScreenshot>;
}

/** Katalogen under public/ där bilderna ligger. */
export const USER_GUIDE_IMAGE_DIRECTORY = 'user-guide';

/** Guidens sökväg i appen, utan bassökväg och språkprefix. */
export const USER_GUIDE_PATH = '/hjalp';
