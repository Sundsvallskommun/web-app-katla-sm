import type { ScreenshotRect } from '@components/user-guide/user-guide-screenshots';

/** Vilken sida av elementet siffran står på. Pilen går från siffran in mot elementet. */
export type CalloutPlacement = 'top' | 'right' | 'bottom' | 'left';

/** En punkt i procent av bildens bredd och höjd. */
export interface PercentPoint {
  x: number;
  y: number;
}

/** En rektangel i procent av bildens bredd och höjd. */
export interface PercentRect extends PercentPoint {
  width: number;
  height: number;
}

export interface CalloutGeometry {
  /** Ramen runt elementet. */
  highlight: PercentRect;
  /** Siffrans mittpunkt. Pilen börjar här, under siffran. */
  badge: PercentPoint;
  /** Pilspetsen, strax utanför ramen. */
  arrowTip: PercentPoint;
}

interface ImageSize {
  width: number;
  height: number;
}

/** Luft mellan elementet och ramen runt det, i bildens pixlar. */
export const HIGHLIGHT_PADDING = 6;
/**
 * Avståndet från ramen till siffrans mitt. Långt nog för att pilen ska synas även i en nedskalad
 * bild. En pil kan ange ett kortare avstånd där siffran annars skulle hamna över text i bilden.
 */
export const BADGE_DISTANCE = 96;
/** Luft mellan pilspetsen och ramen, så att spetsen inte smälter ihop med ramens linje. */
export const ARROW_GAP = 4;
/** Siffran hålls minst så här långt in från bildens kant, så att den aldrig klipps. */
export const BADGE_EDGE_MARGIN = 24;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const toPercent = (point: PercentPoint, image: ImageSize): PercentPoint => ({
  x: (point.x / image.width) * 100,
  y: (point.y / image.height) * 100,
});

/**
 * Räknar ut var ramen, siffran och pilen hamnar för ett utpekat element.
 *
 * Allt returneras i procent av bilden i stället för i pixlar. Bilden skalas med sidans bredd,
 * och med procent följer markeringarna med, medan linjebredd och siffrornas storlek kan hållas
 * fasta i skärmpixlar och därmed läsbara även när bilden är liten.
 */
export const getCalloutGeometry = (
  target: ScreenshotRect,
  image: ImageSize,
  placement: CalloutPlacement,
  distance = BADGE_DISTANCE
): CalloutGeometry => {
  const left = Math.max(target.x - HIGHLIGHT_PADDING, 0);
  const top = Math.max(target.y - HIGHLIGHT_PADDING, 0);
  const right = Math.min(target.x + target.width + HIGHLIGHT_PADDING, image.width);
  const bottom = Math.min(target.y + target.height + HIGHLIGHT_PADDING, image.height);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  const tipByPlacement: Record<CalloutPlacement, PercentPoint> = {
    top: { x: centerX, y: top - ARROW_GAP },
    right: { x: right + ARROW_GAP, y: centerY },
    bottom: { x: centerX, y: bottom + ARROW_GAP },
    left: { x: left - ARROW_GAP, y: centerY },
  };
  const badgeByPlacement: Record<CalloutPlacement, PercentPoint> = {
    top: { x: centerX, y: top - distance },
    right: { x: right + distance, y: centerY },
    bottom: { x: centerX, y: bottom + distance },
    left: { x: left - distance, y: centerY },
  };
  const badge = badgeByPlacement[placement];

  return {
    highlight: {
      ...toPercent({ x: left, y: top }, image),
      width: ((right - left) / image.width) * 100,
      height: ((bottom - top) / image.height) * 100,
    },
    badge: toPercent(
      {
        x: clamp(badge.x, BADGE_EDGE_MARGIN, image.width - BADGE_EDGE_MARGIN),
        y: clamp(badge.y, BADGE_EDGE_MARGIN, image.height - BADGE_EDGE_MARGIN),
      },
      image
    ),
    arrowTip: toPercent(tipByPlacement[placement], image),
  };
};
