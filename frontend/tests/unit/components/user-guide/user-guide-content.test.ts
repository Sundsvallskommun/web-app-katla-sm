import fs from 'node:fs';
import path from 'node:path';

import i18nConfig from '@app/i18nConfig';
import { userGuideManifest } from '@components/user-guide/user-guide-manifest';
import {
  USER_GUIDE_IMAGE_DIRECTORY,
  USER_GUIDE_SCREENSHOTS,
  UserGuideScreenshotId,
} from '@components/user-guide/user-guide-screenshots';
import { GuideStep, USER_GUIDE_APPENDIX, USER_GUIDE_STEPS } from '@components/user-guide/user-guide-steps';
import { getUserGuideUiLabels } from '@components/user-guide/user-guide-ui-labels';
import { createInstance, ResourceKey, ResourceLanguage, TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Guiden består av tre delar som underhålls var för sig: bilderna och manifestet som generatorn
 * skriver, stegen i user-guide-steps.ts och texterna i locales. Testerna här fångar när de har
 * glidit isär – till exempel en ny bild i kontraktet som aldrig genererats, eller en text som
 * hänvisar till en knapp som inte finns.
 */

const localesDir = path.join(process.cwd(), 'locales');
const imageDir = path.join(process.cwd(), 'public', USER_GUIDE_IMAGE_DIRECTORY);
const screenshotIds = Object.keys(USER_GUIDE_SCREENSHOTS) as UserGuideScreenshotId[];
const allSections: GuideStep[] = [...USER_GUIDE_STEPS, ...USER_GUIDE_APPENDIX];

const readLocale = (locale: string): ResourceLanguage =>
  Object.fromEntries(
    fs
      .readdirSync(path.join(localesDir, locale))
      .map((file) => [
        path.basename(file, '.json'),
        JSON.parse(fs.readFileSync(path.join(localesDir, locale, file), 'utf8')) as ResourceKey,
      ])
  );

/** Alla nycklar i namnrymden user-guide som stegen använder. */
const usedGuideKeys = allSections.flatMap((section) => [
  section.titleKey,
  ...(section.badgeKey ? [section.badgeKey] : []),
  ...section.blocks.flatMap((block) =>
    block.kind === 'figure' ? [block.altKey, ...block.callouts.map((callout) => callout.textKey)] : [block.textKey]
  ),
]);

describe('User guide screenshots', () => {
  it('has a generated screenshot for every screenshot in the contract', () => {
    expect(Object.keys(userGuideManifest.screenshots).sort()).toEqual([...screenshotIds].sort());
  });

  it.each(screenshotIds)('measures every target the guide may point at in %s', (id) => {
    const screenshot = userGuideManifest.screenshots[id];
    expect(Object.keys(screenshot.targets).sort()).toEqual([...USER_GUIDE_SCREENSHOTS[id]].sort());

    for (const rect of Object.values(screenshot.targets)) {
      expect(rect.x).toBeGreaterThanOrEqual(-2);
      expect(rect.y).toBeGreaterThanOrEqual(-2);
      expect(rect.x + rect.width).toBeLessThanOrEqual(screenshot.width + 2);
      expect(rect.y + rect.height).toBeLessThanOrEqual(screenshot.height + 2);
    }
  });

  it('ships exactly the image files the manifest refers to', () => {
    const manifestFiles = Object.values(userGuideManifest.screenshots).map((screenshot) => screenshot.file);

    expect(fs.readdirSync(imageDir).sort()).toEqual(manifestFiles.sort());
  });

  it('records when the screenshots were taken', () => {
    expect(userGuideManifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('User guide texts', () => {
  const resources = readLocale(i18nConfig.defaultLocale);
  const i18n = createInstance();

  beforeAll(async () => {
    await i18n.init({
      lng: i18nConfig.defaultLocale,
      resources: { [i18nConfig.defaultLocale]: resources },
      ns: Object.keys(resources),
      defaultNS: 'user-guide',
    });
  });

  it.each(usedGuideKeys)('has a text for %s', (key) => {
    expect(i18n.exists(key, { ns: 'user-guide' })).toBe(true);
  });

  // Etiketterna hämtas ur appens egna översättningar. En nyckel som tagits bort där skulle annars
  // tyst visas som själva nyckeln mitt i guidens text.
  it('takes every button and heading name from an existing translation', () => {
    const requestedKeys: string[] = [];
    const recordingT = ((key: string) => {
      requestedKeys.push(key);
      return i18n.t(key);
    }) as unknown as TFunction;

    getUserGuideUiLabels(recordingT);

    expect(requestedKeys.length).toBeGreaterThan(0);
    for (const key of requestedKeys) {
      expect(i18n.exists(key), `${key} saknas i översättningarna`).toBe(true);
    }
  });

  it('only refers to labels that exist', () => {
    const labelNames = new Set(Object.keys(getUserGuideUiLabels(i18n.t)));
    const placeholders = JSON.stringify(resources['user-guide']).match(/{{\s*\w+\s*}}/g) ?? [];

    for (const placeholder of placeholders) {
      const name = placeholder.replace(/[{}\s]/g, '');
      // number och date fylls i av komponenterna själva, inte av etiketterna.
      if (name === 'number' || name === 'date') continue;
      expect(labelNames.has(name), `${placeholder} är ingen känd etikett`).toBe(true);
    }
  });
});
