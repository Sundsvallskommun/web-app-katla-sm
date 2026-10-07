import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import sharp from 'sharp';

import {
  type ScreenshotRect,
  USER_GUIDE_IMAGE_DIRECTORY,
  USER_GUIDE_SCREENSHOTS,
  type UserGuideManifest,
  type UserGuideScreenshot,
  type UserGuideScreenshotId,
  type UserGuideTargetId,
} from '../../src/components/user-guide/user-guide-screenshots';

/**
 * Skriver bilder och manifest bara när det uttryckligen begärs (`yarn generate:user-guide`).
 * I den vanliga e2e-körningen går generatorn ändå igenom hela flödet och kontrollerar att varje
 * utpekat element finns och syns – ändras flödet så att guiden inte längre stämmer, faller testet.
 */
export const UPDATE_USER_GUIDE = process.env.UPDATE_USER_GUIDE === 'true';

const IMAGE_DIRECTORY = path.join(process.cwd(), 'public', USER_GUIDE_IMAGE_DIRECTORY);
const MANIFEST_PATH = path.join(
  process.cwd(),
  'src',
  'components',
  'user-guide',
  'generated',
  'user-guide-manifest.json'
);

/** WebP med hög kvalitet: text i skärmbilder tål inte hård komprimering, men filerna blir ändå små. */
const WEBP_QUALITY = 90;
const CONTENT_HASH_LENGTH = 8;
/** Next visar en egen knapp i utvecklingsläge. Den hör inte till appen och ska inte synas i bilderna. */
const HIDE_DEV_TOOLS_CSS = 'nextjs-portal { display: none !important; }';
/** Ett utpekat element får sticka ut så här mycket ur bilden innan mätningen räknas som fel. */
const OUTSIDE_TOLERANCE = 2;

type CaptureArea = Locator | ScreenshotRect | 'viewport';

interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Ett element vars innehåll mäts i stället för elementets egen ruta. Se contentOf. */
interface ContentTarget {
  content: Locator;
}

type CaptureTarget = Locator | ContentTarget;

interface CaptureOptions<Screenshot extends UserGuideScreenshotId> {
  /** Den del av sidan som blir bild: ett element, en rektangel i sidans koordinater eller hela fönstret. */
  area: CaptureArea;
  /**
   * Luft runt ett element, så att bilden inte klipps tätt mot kanten. Kan anges per sida, till
   * exempel för att ge pilar plats i marginalen till vänster om fält som fyller hela bredden.
   */
  padding?: number | Partial<Padding>;
  targets: Record<UserGuideTargetId<Screenshot>, CaptureTarget>;
}

const DEFAULT_PADDING = 24;

const round = (value: number): number => Math.round(value * 10) / 10;

const toPadding = (padding: number | Partial<Padding>): Padding =>
  typeof padding === 'number' ?
    { top: padding, right: padding, bottom: padding, left: padding }
  : {
      top: padding.top ?? DEFAULT_PADDING,
      right: padding.right ?? DEFAULT_PADDING,
      bottom: padding.bottom ?? DEFAULT_PADDING,
      left: padding.left ?? DEFAULT_PADDING,
    };

/**
 * Pekar ut det som syns i ett element, inte elementets egen ruta. Rubriker, kryssrutor och
 * radioknappsgrupper är ofta lika breda som sitt kort fast texten är kort, och en ram runt hela
 * bredden lämnar ingen plats åt pilen och visar dessutom fel sak.
 */
export const contentOf = (locator: Locator): ContentTarget => ({ content: locator });

const measure = async (target: CaptureTarget): Promise<ScreenshotRect> => {
  const locator = 'content' in target ? target.content : target;
  await expect(locator).toBeVisible();
  const box =
    'content' in target ?
      await locator.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
      })
    : await locator.boundingBox();
  if (!box || box.width === 0 || box.height === 0) throw new Error('Elementet syns men saknar mått.');
  return box;
};

const resolveArea = async (page: Page, area: CaptureArea, padding: Padding): Promise<ScreenshotRect> => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Skärmbilderna kräver en fast fönsterstorlek.');
  if (area === 'viewport') return { x: 0, y: 0, ...viewport };
  if (!('evaluate' in area)) return area;

  const box = await measure(area);
  const x = Math.max(box.x - padding.left, 0);
  const y = Math.max(box.y - padding.top, 0);
  return {
    x,
    y,
    width: Math.min(box.x + box.width + padding.right, viewport.width) - x,
    height: Math.min(box.y + box.height + padding.bottom, viewport.height) - y,
  };
};

/**
 * Lägger elementet mitt i bild. Formulärets rubrikrad klistrar sig överst vid skroll och skulle
 * annars kunna täcka överkanten av det som fotograferas.
 */
export const centerInView = (locator: Locator) =>
  locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });

/**
 * Tar användarguidens skärmbilder och mäter var de utpekade elementen ligger i varje bild.
 * Läget sparas i manifestet, och guiden ritar sina pilar utifrån det – pilarna hamnar därmed
 * rätt även när layouten ändras, så länge bilderna genereras om.
 */
export class UserGuideRecorder {
  private readonly screenshots = new Map<UserGuideScreenshotId, UserGuideScreenshot>();

  async capture<Screenshot extends UserGuideScreenshotId>(
    page: Page,
    id: Screenshot,
    { area, padding = DEFAULT_PADDING, targets }: CaptureOptions<Screenshot>
  ): Promise<void> {
    await page.addStyleTag({ content: HIDE_DEV_TOOLS_CSS });
    // Inget ska se ut att vara hovrat eller fokuserat i en bild som visar ett utgångsläge.
    await page.mouse.move(0, 0);
    await page.evaluate(async () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      await document.fonts.ready;
    });

    const clip = await resolveArea(page, area, toPadding(padding));
    const measuredTargets: Record<string, ScreenshotRect> = {};

    for (const [targetId, target] of Object.entries<CaptureTarget>(targets)) {
      const box = await measure(target);
      const rect = { x: box.x - clip.x, y: box.y - clip.y, width: box.width, height: box.height };
      const insideClip =
        rect.x >= -OUTSIDE_TOLERANCE &&
        rect.y >= -OUTSIDE_TOLERANCE &&
        rect.x + rect.width <= clip.width + OUTSIDE_TOLERANCE &&
        rect.y + rect.height <= clip.height + OUTSIDE_TOLERANCE;
      expect(insideClip, `${id}: ${targetId} ligger utanför bilden`).toBe(true);
      measuredTargets[targetId] = {
        x: round(rect.x),
        y: round(rect.y),
        width: round(rect.width),
        height: round(rect.height),
      };
    }

    let file = `${id}.webp`;
    if (UPDATE_USER_GUIDE) {
      const png = await page.screenshot({ clip, animations: 'disabled', caret: 'hide', scale: 'device' });
      const webp = await sharp(png).webp({ quality: WEBP_QUALITY }).toBuffer();
      // Innehållet i filnamnet: bildoptimeringen och webbläsaren cachar per adress, och en ny bild
      // under en gammal adress kunde annars visas med pilar som mätts mot den gamla.
      file = `${id}.${createHash('sha256').update(webp).digest('hex').slice(0, CONTENT_HASH_LENGTH)}.webp`;
      await fs.mkdir(IMAGE_DIRECTORY, { recursive: true });
      await fs.writeFile(path.join(IMAGE_DIRECTORY, file), webp);
    }

    this.screenshots.set(id, {
      file,
      width: Math.round(clip.width),
      height: Math.round(clip.height),
      targets: measuredTargets,
    });
  }

  /** Alla bilder i kontraktet är tagna. Ett avbrutet flöde ska inte skriva ett halvt manifest. */
  isComplete(): boolean {
    return Object.keys(USER_GUIDE_SCREENSHOTS).every((id) => this.screenshots.has(id as UserGuideScreenshotId));
  }

  /** Skriver manifestet och tar bort bilder som inte längre ingår i guiden. */
  async writeManifest(): Promise<void> {
    const ids = Object.keys(USER_GUIDE_SCREENSHOTS) as UserGuideScreenshotId[];
    const manifest: UserGuideManifest = {
      generatedAt: new Date().toISOString().slice(0, 10),
      screenshots: Object.fromEntries(
        ids.flatMap((id) => {
          const screenshot = this.screenshots.get(id);
          return screenshot ? [[id, screenshot]] : [];
        })
      ),
    };
    await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

    const currentFiles = new Set(Object.values(manifest.screenshots).map((screenshot) => screenshot.file));
    for (const file of await fs.readdir(IMAGE_DIRECTORY)) {
      if (!currentFiles.has(file)) await fs.rm(path.join(IMAGE_DIRECTORY, file));
    }
  }
}
