import manifestJson from './generated/user-guide-manifest.json';
import type { UserGuideManifest, UserGuideScreenshot, UserGuideScreenshotId } from './user-guide-screenshots';

/**
 * Bildernas mått och de utpekade elementens lägen, så som generatorn mätte dem.
 *
 * Filen skrivs av `yarn generate:user-guide` och ska inte redigeras för hand.
 */
export const userGuideManifest: UserGuideManifest = manifestJson;

export const getUserGuideScreenshot = (id: UserGuideScreenshotId): UserGuideScreenshot | undefined =>
  userGuideManifest.screenshots[id];
